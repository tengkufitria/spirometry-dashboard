import PatientPanel from "./PatientPanel"
import MonitorScreen from "./MonitorScreen"

export default function LcdLayout({
  systemState,
  patient,
  onStart,
  onReset,
  pressureData,
  coughData,
  notification
}) {
  return (
    <div className="h-full grid grid-cols-12 gap-2 p-2 bg-gray-50 text-gray-900">

      {/* 🔵 LEFT PANEL */}
      <div className="col-span-4 h-full border border-gray-300 rounded-lg p-2 bg-white">

        {/* INPUT MODE */}
        {(systemState === "idle" || systemState === "input") && (
          <PatientPanel onStart={onStart} />
        )}

        {/* INFO PASIEN */}
        {(systemState !== "idle" && systemState !== "input") && patient && (
          <div>
            <h2 className="text-lg font-bold mb-2">Patient Info</h2>
            <p>Name: {patient.name}</p>
            <p>Age: {patient.age}</p>
            <p>Gender: {patient.gender}</p>

            <button
              onClick={onReset}
              className="mt-4 bg-red-600 px-3 py-1 rounded"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* 🔴 RIGHT PANEL (MONITOR) */}
      <div className="col-span-8 h-full border border-gray-300 rounded-lg p-2 bg-white">

        <MonitorScreen
          systemState={systemState}
          patient={patient}
          pressureData={pressureData}
          coughData={coughData}
          notification={notification}
        />

      </div>

    </div>
  )
}