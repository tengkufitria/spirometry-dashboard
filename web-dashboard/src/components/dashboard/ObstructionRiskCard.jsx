export default function ObstructionRiskCard({ ratio }) {
  return (
    <div className="flex-1 bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-muted border border-border dark:border-border-dark p-1 rounded-full text-sm transform -rotate-45">link</span>
          <div>
            <p className="text-xs text-muted font-medium">Obstruction Risk</p>
            <h3 className="text-2xl font-bold">{ratio}%</h3>
          </div>
        </div>
        <span className="text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-muted px-3 py-1 rounded-full">COPD</span>
      </div>

      <div className="flex items-end gap-1 h-12">
        {[4, 5, 7, 6, 8, 10, 12, 15, 14, 18, 25, 20, 16, 12, 10, 8, 6, 5, 4, 3].map((h, i) => (
          <div key={i} className={`flex-1 rounded-t-sm ${i === 10 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} style={{ height: `${h * 4}%` }}></div>
        ))}
      </div>
    </div>
  )
}
