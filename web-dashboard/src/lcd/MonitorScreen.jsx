import Waveform from "./Waveform"

export default function MonitorScreen({
  patient,
  systemState,
  pressureData = [],
  coughData = [],
  notification,
  onReset
}) {

  const isPressure = systemState === "pressure" || systemState === "done_spiro"
  const isCough = systemState === "cough" || systemState === "done_cough"
  const isDone = systemState === "done_spiro" || systemState === "done_cough"

  // 🔥 PILIH DATA AKTIF
  const activeData = isPressure
    ? pressureData
    : isCough
    ? coughData
    : []



  return (
    <div className="w-full h-full flex flex-col bg-gray-50 text-gray-900 p-4 font-mono relative">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 z-10 bg-white p-3 rounded-lg border border-gray-200 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-600 font-bold">
            {patient?.name?.charAt(0) || "-"}
          </div>
          <div>
            <p className="font-bold text-sm tracking-wider uppercase text-gray-800">{patient?.name || "UNKNOWN PATIENT"}</p>
            <p className="text-[10px] tracking-widest flex items-center gap-2 mt-1">
              {systemState === "pressure" && <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> <span className="text-green-400">PRESSURE ACTIVE</span></>}
              {systemState === "cough" && <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> <span className="text-red-400">COUGH ANALYSIS</span></>}
              {systemState === "ready" && <><span className="w-2 h-2 rounded-full bg-green-500"></span> <span className="text-green-400">SYSTEM READY</span></>}
              {systemState === "done_spiro" && <><span className="w-2 h-2 rounded-full bg-yellow-500"></span> <span className="text-yellow-400">SPIROMETRY COMPLETE</span></>}
              {systemState === "done_cough" && <><span className="w-2 h-2 rounded-full bg-yellow-500"></span> <span className="text-yellow-400">SESSION COMPLETED</span></>}
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg font-bold text-[10px] tracking-widest border border-red-500/50 transition-colors uppercase"
        >
          Reset Session
        </button>
      </div>

      {/* 🔥 SINGLE WAVEFORM */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-2 z-10 relative overflow-hidden shadow-inner">
        {/* Subtle scanline effect over waveform */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.03)_50%)] bg-[size:100%_4px] pointer-events-none z-20 mix-blend-overlay opacity-50"></div>
        <Waveform
          systemState={systemState}
          pressureData={pressureData}
          coughData={coughData}
        />
      </div>



      {/* NOTIFICATION OVERLAY */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-50 text-yellow-600 px-8 py-4 rounded-xl border-2 border-yellow-300 text-base md:text-lg font-bold tracking-widest z-50 shadow-[0_8px_30px_rgba(234,179,8,0.3)] uppercase whitespace-pre-line text-center">
          {notification}
        </div>
      )}

    </div>
  )
}