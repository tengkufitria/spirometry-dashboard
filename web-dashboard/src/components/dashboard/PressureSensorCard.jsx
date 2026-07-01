export default function PressureSensorCard({ fev1, fvc }) {
  const ratio = Math.round((fev1 / fvc) * 100) || 0

  return (
    <div className="flex-1 bg-white dark:bg-surface-container-dark p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex flex-col justify-between relative overflow-hidden group">
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <span className="material-symbols-outlined text-[20px]">speed</span>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Pressure Sensor</p>
            <p className="text-xs text-green-500 font-bold flex items-center gap-1 mt-0.5"><span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> Connected</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <p className="text-[11px] text-muted font-bold uppercase tracking-wide">FEV1</p>
          <div className="flex items-baseline gap-1 mt-1">
            <h4 className="text-2xl font-extrabold text-on-surface dark:text-on-surface-dark">{fev1}</h4>
            <span className="text-xs font-bold text-muted">L</span>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <p className="text-[11px] text-muted font-bold uppercase tracking-wide">FVC</p>
          <div className="flex items-baseline gap-1 mt-1">
            <h4 className="text-2xl font-extrabold text-on-surface dark:text-on-surface-dark">{fvc}</h4>
            <span className="text-xs font-bold text-muted">L</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between relative z-10 bg-primary/5 dark:bg-primary/10 px-4 py-3 rounded-2xl">
        <span className="text-xs font-extrabold text-primary dark:text-primary-400 uppercase tracking-wide">Ratio (FEV1/FVC)</span>
        <span className="text-lg font-black text-primary dark:text-primary-300">{ratio}%</span>
      </div>
    </div>
  )
}
