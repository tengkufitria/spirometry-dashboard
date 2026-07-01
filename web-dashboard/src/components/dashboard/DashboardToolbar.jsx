import { useNavigate } from "react-router-dom"

export default function DashboardToolbar() {
  const navigate = useNavigate()

  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1 bg-white dark:bg-surface-container-dark rounded-full px-4 py-3 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-border-dark">
        <span className="font-semibold text-sm mr-2">Medication</span>
        <span className="material-symbols-outlined text-muted text-sm">search</span>
        <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none w-full text-sm placeholder:text-muted" />
      </div>

      <button onClick={() => navigate("/lcd")} className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-md transition">
        <span className="material-symbols-outlined">add</span>
      </button>

      <button className="w-12 h-12 rounded-full bg-white dark:bg-surface-container-dark flex items-center justify-center shadow-sm border border-gray-100 dark:border-border-dark hover:bg-gray-50 transition">
        <span className="material-symbols-outlined text-muted">folder</span>
      </button>

      <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-semibold shadow-md transition flex items-center gap-2">
        Consultation
        <span className="material-symbols-outlined text-sm">arrow_outward</span>
      </button>
    </div>
  )
}
