export default function AlertCard({ time, title, desc, severity = "critical" }) {

  const styles = {
    critical: {
      bg: "bg-red-50 dark:bg-red-900/10",
      border: "border-red-100 dark:border-red-900/30",
      text: "text-red-600 dark:text-red-400",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/10",
      border: "border-yellow-100 dark:border-yellow-900/30",
      text: "text-yellow-600 dark:text-yellow-400",
    },
    normal: {
      bg: "bg-white dark:bg-surface-container-dark",
      border: "border-gray-100 dark:border-border-dark",
      text: "text-on-surface dark:text-on-surface-dark",
    }
  }

  const s = styles[severity]

  return (
    <div className={`${s.bg} border ${s.border} 
      p-4 rounded-2xl shadow-sm
      transition hover:shadow-md`}
    >
      {/* TIME */}
      <p className="text-[10px] text-muted font-semibold">
        {time}
      </p>

      {/* TITLE */}
      <h4 className={`font-bold text-sm mt-1 ${s.text}`}>
        {title}
      </h4>

      {/* DESC */}
      <p className="text-xs text-muted mt-1">
        {desc}
      </p>

    </div>
  )
}