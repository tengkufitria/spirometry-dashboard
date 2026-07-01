export default function VitalsBar({
  systemState,
  pressureData = [],
  coughData = []
}) {

  // 🔢 ambil nilai terakhir
  const latestPressure = Math.round(pressureData.at(-1) || 0)
  const latestCough = Math.round(coughData.at(-1) || 0)

  // 📈 peak pressure
  const peakPressure = Math.max(0, ...pressureData)

  // ⏱ fake rate (bisa diganti dari ESP32 nanti)
  const rate = pressureData.length > 10 ? 16 + Math.round(Math.random() * 2) : 0

  // 🎨 warna dinamis
  const pressureColor =
    latestPressure > 80 ? "text-red-600" :
    latestPressure > 50 ? "text-yellow-600" :
    "text-green-600"

  const coughColor =
    latestCough > 70 ? "text-red-600" :
    latestCough > 30 ? "text-yellow-600" :
    "text-green-600"

  return (
    <div className="grid grid-cols-4 gap-2 mt-2 text-center">

      {/* RATE */}
      <div className="bg-white border border-gray-200 shadow-sm p-2 rounded">
        <p className="text-xs text-gray-500">RATE</p>
        <p className="text-lg font-bold text-green-600">
          {rate}
        </p>
      </div>

      {/* PRESSURE */}
      <div className="bg-white border border-gray-200 shadow-sm p-2 rounded">
        <p className="text-xs text-gray-500">PRESS</p>
        <p className={`text-lg font-bold ${pressureColor}`}>
          {latestPressure}
        </p>
      </div>

      {/* PEAK */}
      <div className="bg-white border border-gray-200 shadow-sm p-2 rounded">
        <p className="text-xs text-gray-500">PEAK</p>
        <p className="text-lg font-bold text-blue-500">
          {Math.round(peakPressure)}
        </p>
      </div>

      {/* COUGH */}
      <div className="bg-white border border-gray-200 shadow-sm p-2 rounded">
        <p className="text-xs text-gray-500">COUGH</p>
        <p className={`text-lg font-bold ${coughColor}`}>
          {latestCough}
        </p>
      </div>

    </div>
  )
}