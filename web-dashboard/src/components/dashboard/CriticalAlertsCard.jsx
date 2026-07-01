export default function CriticalAlertsCard({ alerts }) {
  return (
    <div className="w-48 bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <p className="text-sm font-bold leading-tight">Critical<br />Alerts</p>
        <span className="material-symbols-outlined text-muted text-sm cursor-pointer hover:text-on-surface">arrow_outward</span>
      </div>
      <div>
        <h3 className="text-3xl font-extrabold">{alerts.length}</h3>
        <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Active</p>
      </div>
    </div>
  )
}
