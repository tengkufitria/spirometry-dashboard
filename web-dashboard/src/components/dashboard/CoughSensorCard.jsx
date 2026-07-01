export default function CoughSensorCard({ coughStatus, confidence }) {
  const status = coughStatus || "-"
  const parsedConf = parseFloat(confidence);
  const conf = (!isNaN(parsedConf)) ? (parsedConf > 1 && parsedConf <= 100 ? parsedConf : (parsedConf <= 1 ? parsedConf * 100 : 100)).toFixed(1) + "%" : "-";

  let bgColor = "bg-gray-50 text-gray-600"
  let iconColor = "text-gray-500"
  
  if (status.includes("PPOK") || status.includes("SEVERE") || status.includes("Critical")) {
    bgColor = "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
    iconColor = "text-red-500"
  } else if (status.includes("Gejala") || status.includes("MILD") || status.includes("MODERATE")) {
    bgColor = "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
    iconColor = "text-amber-500"
  } else if (status === "Sehat" || status === "NORMAL") {
    bgColor = "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
    iconColor = "text-green-500"
  }

  return (
    <div className="flex-1 bg-white dark:bg-surface-container-dark p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex flex-col justify-between relative overflow-hidden min-h-[200px]">

      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Audio Analysis</p>
            <p className="text-xs text-purple-500 font-bold flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Cough Sensor
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="z-10 flex flex-col items-center justify-center flex-1 my-4">
        <div className={`px-4 py-2 rounded-2xl border ${bgColor} border-opacity-50 flex items-center justify-center w-full max-w-[200px] shadow-inner`}>
           <span className="text-lg font-black text-center whitespace-pre-wrap">{status.toUpperCase()}</span>
        </div>
        
        {conf !== "-" && (
          <div className="mt-3 text-center">
            <span className="text-[10px] font-extrabold text-muted uppercase tracking-widest block mb-1">Probability</span>
            <span className={`text-2xl font-black ${iconColor}`}>{conf}</span>
          </div>
        )}
      </div>

    </div>
  )
}
