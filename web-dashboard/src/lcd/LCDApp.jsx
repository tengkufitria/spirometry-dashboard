import { useState, useRef, useEffect } from "react"
import { io } from "socket.io-client"
import { SOCKET_URL } from "../api/config"

import PatientPanel from "../lcd/PatientPanel"
import MonitorScreen from "../lcd/MonitorScreen"
import aerovixLogo from "../assets/logo_aerovix-Photoroom.png"

export default function LcdApp() {
  const [systemState, setSystemState] = useState("checking")
  const [bootLines, setBootLines] = useState([])
  const [patient, setPatient] = useState(null)
  const [pressureData, setPressureData] = useState([])
  const [coughData, setCoughData] = useState([])
  const [notification, setNotification] = useState("")

  const intervalsRef = useRef([])

  // 🔄 SOCKET & CLEANUP
  useEffect(() => {
    const socket = io(SOCKET_URL)

    // Listen to real data from backend
    socket.on("COUGH_LIVE", (data) => {
      setSystemState(prev => {
        if (prev === "calibrating") return "cough";
        return prev;
      });
      setNotification(">>> COUGH NOW <<<");
      setCoughData(prev => [...prev.slice(-500), { value: data.value || 0 }]);
    });

    socket.on("SPIROMETRY_LIVE", (data) => {
      setSystemState(prev => {
        if (prev === "calibrating") return "pressure";
        return prev;
      });
      setNotification(">>> BLOW NOW <<<");
      
      if (data.voltages && data.voltages.length > 0) {
        const newPoints = data.voltages.map((v, i) => ({
          value: v,
          elapsed: data.times ? data.times[i] : 0
        }));
        setPressureData(prev => [...prev, ...newPoints].slice(-500));
      } else if (data.value !== undefined) {
        setPressureData(prev => [...prev.slice(-500), data]);
      }
    });

    socket.on("ESP_CONNECTED", (data) => {
      setSystemState("booting");
      setBootLines([]);
    });

    socket.on("ESP_STATUS", (data) => {
      if (data.connected) {
        setSystemState(prev => {
          if (prev === "waiting" || prev === "checking") return "idle";
          return prev;
        });
      } else {
        setSystemState("waiting");
      }
    });

    socket.on("EXAMINATION_FINAL", (data) => {
      setSystemState("done_spiro");
      setNotification(`SPIROMETRY COMPLETE\nFINAL SCREENING: ${data.diagnosis || "UNKNOWN"}\n\nNOW PRESS GREEN BUTTON FOR COUGH TEST`);
    });

    socket.on("COUGH_DONE", (data) => {
      setSystemState("done_cough");
      let probText = "";
      if (data.confidence) {
        let val = Number(data.confidence);
        if (!isNaN(val)) {
          let perc = val > 1 && val <= 100 ? val : (val <= 1 ? val * 100 : 100);
          probText = `\nPROBABILITY: ${perc.toFixed(1)}%`;
        } else {
          probText = `\nPROBABILITY: ${data.confidence}`;
        }
      }
      setNotification(`AUDIO ANALYSIS COMPLETE\nSTATUS: ${data.result || "UNKNOWN"}${probText}\n\nPRESS ANY BUTTON TO SAVE & FINISH`);
    });

    // Handle Streaming Cough
    socket.on("COUGH_LIVE_BATCH", (data) => {
      if (data.values) {
        const newPoints = data.values.map(v => ({ value: v }));
        setCoughData(prev => [...prev, ...newPoints].slice(-500));
      }
    });

    // 🔴 Hardware Button triggers
    socket.on("SYSTEM_LOG", (log) => {
      if (log.message === "CALIBRATING... DO NOT BLOW") {
        setSystemState("calibrating");
        setNotification("CALIBRATING SENSORS...\nDO NOT BLOW");
      } else if (log.message === "BLOW NOW") {
        setSystemState("pressure");
        setNotification(">>> BLOW NOW <<<");
      } else if (log.message === "COUGH_READY") {
        setSystemState("cough");
        setNotification(">>> COUGH NOW <<<");
      } else if (log.message === "COUGH_DONE") {
        setSystemState("done");
        setNotification("COUGH RECORDING COMPLETE");
      } else if (log.message === "COUGH_SAVED") {
        resetSystem();
        setNotification("SESSION SAVED SUCCESSFULLY");
        setTimeout(() => setNotification(""), 3000);
      }
    });

    return () => {
      socket.disconnect();
      intervalsRef.current.forEach(clearInterval)
    }
  }, [])

  // 🚀 BOOT SEQUENCE ANIMATION
  useEffect(() => {
    if (systemState !== "booting") return;

    const sequence = [
      "Connecting WiFi...",
      "WiFi Connected",
      "ESP32 IP: 172.20.10.2",
      "ADS1115 READY",
      "WebSocket Initialized",
      "",
      "SYSTEM READY",
      "",
      "WS CONNECTED"
    ];

    let step = 0;
    setBootLines([]);

    const interval = setInterval(() => {
      setBootLines(prev => [...prev, sequence[step]]);
      step++;
      
      if (step >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => setSystemState("idle"), 1200);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [systemState]);

  // 🔄 RESET
  const resetSystem = () => {
    intervalsRef.current.forEach(clearInterval)
    intervalsRef.current = []
    setSystemState("idle")
    setPatient(null)
    setPressureData([])
    setCoughData([])
    setNotification("")
  }

  // 🧾 INPUT PASIEN
  const handleStart = (data) => {
    setPatient(data)
    setSystemState("awaiting_button")
    setPressureData([])
    setCoughData([])

    // Backend patientController.js has already sent this data to ESP32 via WS.
    // We now just tell the LCD to wait for the physical button press.
    setNotification("PATIENT LOADED\nPRESS RED BUTTON (PIN 12) FOR SPIROMETRY\nPRESS GREEN BUTTON (PIN 27) FOR COUGH SENSOR")
  }

  return (
    <div className="w-full h-full">

      {(systemState === "waiting" || systemState === "checking") && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-red-600 p-8 font-mono relative overflow-hidden text-center">
          
          <div className="z-10 flex flex-col items-center gap-4">
            <span className="text-4xl animate-pulse">⚠️</span>
            <p className="text-xl font-bold tracking-widest uppercase">ESP32 DISCONNECTED</p>
            <p className="text-sm text-red-500/70 tracking-widest max-w-xs">
              {systemState === "checking" ? "CHECKING CONNECTION..." : "PLEASE TURN ON THE HARDWARE AND WAIT FOR WIFI CONNECTION."}
            </p>
          </div>
        </div>
      )}

      {systemState === "booting" && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-green-600 p-8 font-mono relative overflow-hidden">
          
          <div className="z-10 flex flex-col items-center gap-6">
            {/* Loading Spinner */}
            <div className="relative flex items-center justify-center w-20 h-20">
              <span className="w-20 h-20 rounded-full border-2 border-gray-200 border-t-green-500 animate-[spin_1s_linear_infinite] absolute"></span>
              <span className="w-14 h-14 rounded-full border-2 border-gray-200 border-b-green-400 animate-[spin_1.5s_linear_reverse_infinite] absolute"></span>
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            
            {/* Status Text */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-gray-500 text-xs tracking-widest mb-2">INITIALIZING AEROVIX TERMINAL</p>
              <p className="text-sm md:text-base tracking-widest uppercase animate-pulse font-bold">
                {bootLines.length > 0 ? bootLines[bootLines.length - 1] : "BOOTING..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {systemState === "idle" && (
        <div 
          className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-8 cursor-pointer relative overflow-hidden"
          onClick={() => setSystemState("input")}
        >
          
          <img src={aerovixLogo} alt="Aerovix Logo" className="w-80 mb-8 z-10 animate-[pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
          
          <div className="z-10 flex flex-col items-center gap-4">
            <p className="text-green-600 font-bold tracking-[0.3em] text-xl animate-pulse">TAP TO START</p>
            <p className="text-gray-500 text-xs tracking-widest uppercase">AEROVIX PORTABLE TERMINAL</p>
          </div>
        </div>
      )}

      {systemState === "input" && (
        <PatientPanel onStart={handleStart} systemState={systemState} />
      )}

      {(systemState === "calibrating" || systemState === "awaiting_button") && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-6 font-mono relative">
          
          <div className="z-10 flex flex-col items-center gap-6">
            {systemState === "awaiting_button" ? (
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-4 border-green-500/50 animate-pulse">
                <span className="material-symbols-outlined text-green-600 text-4xl">touch_app</span>
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                <span className="w-16 h-16 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin absolute"></span>
                <span className="w-12 h-12 rounded-full border-2 border-gray-200 border-b-green-400 animate-[spin_1.5s_linear_reverse] absolute"></span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
            )}
            
            <div className="flex flex-col items-center gap-2 text-center">
              {notification.split('\n').map((line, i) => (
                <p key={i} className={`text-sm tracking-widest uppercase animate-pulse ${i === 0 ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {(systemState === "pressure" || systemState === "cough" || systemState === "done_spiro" || systemState === "done_cough") && (
        <MonitorScreen
          systemState={systemState}
          patient={patient}
          pressureData={pressureData}
          coughData={coughData}
          notification={notification}
          onReset={resetSystem}
        />
      )}

    </div>
  )
}