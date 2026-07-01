import { useEffect, useRef, useState } from "react"

export default function Waveform({
  pressureData = [],
  coughData = [],
  systemState
}) {
  const [scanX, setScanX] = useState(0)

  const flowSmoothRef = useRef([])
  const volSmoothRef = useRef([])
  const coughSmoothRef = useRef([])

  const [displayFlow, setDisplayFlow] = useState([])
  const [displayVolume, setDisplayVolume] = useState([])
  const [displayCough, setDisplayCough] = useState([])

  // ======================================================
  // SCANLINE
  // ======================================================
  useEffect(() => {
    let raf
    const loop = () => {
      setScanX(prev => (prev + 2) % 400)
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  // ======================================================
  // DATA SMOOTHING
  // ======================================================
  useEffect(() => {
    if (!pressureData.length) return
    const prevFlow = flowSmoothRef.current
    const prevVol = volSmoothRef.current
    const nextFlow = []
    const nextVol = []

    pressureData.slice(-500).forEach((item, i) => {
      const fVal = typeof item === 'object' ? (item?.value || 0) : (item || 0)
      const vVal = typeof item === 'object' ? (item?.volume || 0) : 0
      
      const pF = prevFlow[i] ?? fVal
      const pV = prevVol[i] ?? vVal

      nextFlow[i] = pF * 0.8 + fVal * 0.2
      nextVol[i] = pV * 0.8 + vVal * 0.2
    })

    flowSmoothRef.current = nextFlow
    volSmoothRef.current = nextVol

    setDisplayFlow(nextFlow)
    setDisplayVolume(nextVol)
  }, [pressureData])

  useEffect(() => {
    if (!coughData.length) return
    const prevSmooth = coughSmoothRef.current
    const next = []
    coughData.slice(-500).forEach((item, i) => {
      const val = typeof item === 'object' ? (item?.value || 0) : (item || 0)
      const prev = prevSmooth[i] ?? val
      next[i] = prev * 0.8 + val * 0.2
    })
    coughSmoothRef.current = next
    setDisplayCough(next)
  }, [coughData])

  // ======================================================
  // SCALES & PATHS
  // ======================================================
  const FLOW_MAX = 12 // Using 12 L/s for Flow
  const VOL_MAX = 6
  const COUGH_MAX = 0.5 // Normalized RMS Audio (0.0 to 1.0) - reduced for bigger chart

  const normalize = (v, max, height) => (v / max) * height

  const createTimePath = (data, max, height) => {
    if (!data || data.length < 2) return ""
    const stepX = 400 / (data.length - 1)
    
    return data.map((v, i) => {
      const x = i * stepX
      const y = height - normalize(v, max, height)
      if (i === 0) return `M ${x} ${y}`
      const px = (i - 1) * stepX
      const py = height - normalize(data[i - 1], max, height)
      const cx = (px + x) / 2
      const cy = (py + y) / 2
      return `Q ${px} ${py}, ${cx} ${cy}`
    }).join(" ")
  }

  const createTimeFill = (data, pathStr, height) => {
    if (!data || data.length < 2) return ""
    const stepX = 400 / (data.length - 1)
    const lastX = (data.length - 1) * stepX
    return `${pathStr} L ${lastX} ${height} L 0 ${height} Z`
  }



  // ======================================================
  // COLORS
  // ======================================================
  const softGreen = "#10b981" // Flow (Emerald)
  const softPink = "#db2777" // Cough (Pink)

  const showPressure = systemState === "pressure" || systemState === "done_spiro" || systemState === "done"
  const isCough = systemState === "cough" || systemState === "done_cough"
  
  return (
    <div className="w-full h-full bg-white rounded-xl relative overflow-hidden shadow-sm border border-gray-200">
      
      <div className="absolute top-2 right-3 text-[10px] z-10 font-bold flex flex-col gap-1 tracking-wider text-right">
        {showPressure && <span style={{ color: softGreen }}>FLOW RATE (L/s)</span>}
        {isCough && <span style={{ color: softPink }}>COUGH SENSOR (Amplitude)</span>}
        {systemState === "idle" && <span style={{ color: "#888" }}>SYSTEM IDLE - WAITING FOR SENSOR</span>}
      </div>

      <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="w-full h-full relative z-10 mt-2">
        {/* PRESSURE/VOLTAGE WAVEFORM */}
        {showPressure && displayFlow.length > 0 && (
          <>
            <path d={createTimeFill(displayFlow, createTimePath(displayFlow, FLOW_MAX, 180), 180)} fill={softGreen} fillOpacity="0.25" />
            <path d={createTimePath(displayFlow, FLOW_MAX, 180)} stroke={softGreen} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* COUGH WAVEFORM */}
        {isCough && displayCough.length > 0 && (
          <>
            <path d={createTimeFill(displayCough, createTimePath(displayCough, COUGH_MAX, 180), 180)} fill={softPink} fillOpacity="0.25" />
            <path d={createTimePath(displayCough, COUGH_MAX, 180)} stroke={softPink} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* Y-AXIS GRID AND LABELS */}
        {showPressure && [2, 4, 6, 8, 10, 12].map(val => {
          const yPos = 180 - (val / FLOW_MAX) * 180;
          return (
            <g key={`grid-${val}`}>
               <line x1="0" x2="400" y1={yPos} y2={yPos} stroke="#ccc" strokeDasharray="2 2" opacity="0.4" />
               <text x="5" y={yPos === 0 ? 10 : yPos - 2} fill="#6b7280" fontSize="9" fontFamily="monospace" opacity="0.8">
                 {val}
               </text>
            </g>
          );
        })}

        {/* BASELINE */}
        <line x1="0" x2="400" y1="180" y2="180" stroke="#999" strokeDasharray="4 4" opacity="0.5" />
        {showPressure && (
           <text x="5" y="176" fill="#6b7280" fontSize="9" fontFamily="monospace" opacity="0.8">
             0
           </text>
        )}
        
        {/* X-AXIS TICKS AND LABELS */}
        {((showPressure && pressureData.length > 0) || (isCough && coughData.length > 0)) && (
          <g>
            {[0, 1, 2, 3, 4].map(i => {
              const dataObj = showPressure ? pressureData : coughData;
              const idx = Math.floor(i * (dataObj.length - 1) / 4);
              const point = dataObj[idx];
              if (!point) return null;
              
              const xPos = i * 100;
              let timeSec = 0;
              if (typeof point === 'object' && point.elapsed !== undefined) {
                timeSec = Number(point.elapsed);
              } else {
                timeSec = (idx * 0.02); // fallback
              }

              return (
                <g key={`x-${i}`}>
                  <line x1={xPos} x2={xPos} y1="180" y2="184" stroke="#999" strokeWidth="1" opacity="0.5" />
                  <text 
                    x={xPos === 0 ? 2 : (xPos === 400 ? 375 : xPos - 12)} 
                    y="196" 
                    fill="#6b7280" 
                    fontSize="9" 
                    fontFamily="monospace"
                    opacity="0.8"
                  >
                    {timeSec.toFixed(1)}s
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* SCANLINE */}
        {systemState !== "idle" && (
          <line x1={scanX} x2={scanX} y1="0" y2="200" stroke="#333" strokeWidth="1" opacity="0.3" />
        )}
      </svg>
    </div>
  )
}