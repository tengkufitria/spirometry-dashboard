import { useState } from "react"
import useRealtimeData from "../hooks/useRealtimeData"

// Helper: display value or dash
const val = (v, suffix = "") => (v !== undefined && v !== null && v !== "") ? `${v}${suffix}` : "—"

const STATUS_STYLES = {
  "VERY SEVERE OBSTRUCTION": "bg-red-100 text-red-600 dark:bg-red-900/30",
  "SEVERE OBSTRUCTION": "bg-orange-100 text-orange-600 dark:bg-orange-900/30",
  "MODERATE OBSTRUCTION": "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
  "MILD OBSTRUCTION": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30",
  "NORMAL": "bg-green-100 text-green-600 dark:bg-green-900/30",
  "TEST INVALID": "bg-gray-100 text-gray-600 dark:bg-gray-800/30",
  "COPD": "bg-red-100 text-red-600 dark:bg-red-900/30",
  "NON-COPD": "bg-green-100 text-green-600 dark:bg-green-900/30",
  "Stable": "bg-green-100 text-green-600 dark:bg-green-900/30",
  "OBSTRUCTIVE SUSPECT": "bg-red-100 text-red-600 dark:bg-red-900/30",
}

const translateStatus = (status) => {
  if (!status) return "-";
  if (status.toUpperCase() === "PPOK" || status.toUpperCase() === "COPD") return "COPD";
  if (status.toUpperCase() === "NON-COPD" || status === "Sehat" || status === "NORMAL" || status === "Gejala Ringan") return "NON-COPD";
  return status;
}

export default function ReportsPages() {
  const { patients, alerts, loading } = useRealtimeData()
  const error = null // Error handling is managed by the hook if needed

  // Analytics Calculations
  const total = patients.length || 1
  
  // Spirometry Stats
  const obsCount = patients.filter(p => p.ratio > 0 && p.ratio < 70).length
  const normalCount = patients.filter(p => p.ratio >= 70 || !p.ratio).length

  const obsPct = Math.round((obsCount / total) * 100) || 0
  const normalPct = Math.round((normalCount / total) * 100) || 0

  const spiroObsDash = (obsPct / 100) * 150
  const spiroNormDash = (normalPct / 100) * 251

  // Cough Stats (Merged Mild into Healthy per request)
  const coughSehatCount = patients.filter(p => translateStatus(p.coughStatus) === "NON-COPD").length
  const coughPpokCount = patients.filter(p => translateStatus(p.coughStatus) === "COPD").length

  const coughSehatPct = Math.round((coughSehatCount / total) * 100) || 0
  const coughPpokPct = Math.round((coughPpokCount / total) * 100) || 0

  const coughPpokDash = (coughPpokPct / 100) * 150
  const coughSehatDash = (coughSehatPct / 100) * 251

  const aggregateStats = [
    { title: "Total Screenings", value: patients.length, icon: "group", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-900/20" },
    { title: "Obstructive Suspect", value: obsCount, icon: "emergency", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
    { title: "Normal", value: normalCount, icon: "check_circle", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { title: "NON-COPD", value: coughSehatCount, icon: "health_and_safety", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "COPD", value: coughPpokCount, icon: "coronavirus", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ]

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-8 pr-2">

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Aggregate Report</h1>
          <p className="text-sm font-semibold text-muted mt-1">Population Data &amp; Sensor Analytics</p>
        </div>
      </div>

      {/* TOP ROW: Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {aggregateStats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div>
              <h3 className="text-2xl font-black">{stat.value}</h3>
              <p className="text-xs font-bold text-muted">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MIDDLE ROW: Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Spirometry Donut Chart */}
        <div className="bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Spirometry Diagnostics</h3>
            <span className="material-symbols-outlined text-muted text-sm bg-gray-50 p-1.5 rounded-full">air</span>
          </div>
          
          <div className="flex-1 w-full flex flex-col items-center justify-center">
            <div className="w-48 h-48 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-md">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray={`${spiroNormDash} 251`} strokeLinecap="round" />
                
                <circle cx="50" cy="50" r="24" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                <circle cx="50" cy="50" r="24" fill="transparent" stroke="#ec4899" strokeWidth="8" strokeDasharray={`${spiroObsDash} 150`} strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex gap-6 mt-8 w-full justify-center text-[10px] font-bold text-muted uppercase tracking-wider">
              <div className="flex flex-col items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal<br/><span className="text-on-surface dark:text-on-surface-dark font-black text-xs">{normalPct}%</span></div>
              <div className="flex flex-col items-center gap-1 text-center"><span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Obstructive<br/>Suspect<br/><span className="text-on-surface dark:text-on-surface-dark font-black text-xs">{obsPct}%</span></div>
            </div>
          </div>
        </div>

        {/* Cough Analysis Donut Chart */}
        <div className="bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Cough Analysis</h3>
            <span className="material-symbols-outlined text-muted text-sm bg-purple-50 text-purple-500 p-1.5 rounded-full">graphic_eq</span>
          </div>
          
          <div className="flex-1 w-full flex flex-col items-center justify-center">
            <div className="w-48 h-48 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-md">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray={`${coughSehatDash} 251`} strokeLinecap="round" />
                
                <circle cx="50" cy="50" r="24" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                <circle cx="50" cy="50" r="24" fill="transparent" stroke="#ec4899" strokeWidth="8" strokeDasharray={`${coughPpokDash} 150`} strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex gap-4 mt-8 w-full justify-center text-[10px] font-bold text-muted uppercase tracking-wider">
              <div className="flex flex-col items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> NON-COPD<br/><span className="text-on-surface dark:text-on-surface-dark font-black text-xs">{coughSehatPct}%</span></div>
              <div className="flex flex-col items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> COPD<br/><span className="text-on-surface dark:text-on-surface-dark font-black text-xs">{coughPpokPct}%</span></div>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: Table */}
      <div className="flex flex-col gap-6">

        {/* Patient Reports Table */}
        <div className="bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex flex-col overflow-hidden min-h-[400px] w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg">Latest Screenings</h3>
              <p className="text-xs text-muted">Combined Spirometry & Cough Analysis</p>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <p className="text-xs font-bold text-muted">Fetching records…</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-extrabold text-muted uppercase tracking-wider border-b border-gray-100 dark:border-border-dark">
                    <th className="pb-4 px-2">Patient</th>
                    <th className="pb-4">Spiro Status</th>
                    <th className="pb-4">FEV1/FVC</th>
                    <th className="pb-4">Cough Status</th>
                    <th className="pb-4">Cough Score</th>
                    <th className="pb-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.slice(0, 10).map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors last:border-0">
                      <td className="py-4 px-2 font-bold text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 text-xs font-black">
                            {p.name?.charAt(0) ?? "?"}
                          </div>
                          {val(p.name)}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full ${STATUS_STYLES[p.status] || STATUS_STYLES.Stable}`}>
                          {val(p.status)}
                        </span>
                      </td>
                      <td className="py-4 text-xs font-black">
                        {p.ratio !== undefined && p.ratio !== "-" ? `${p.ratio}%` : "—"}
                      </td>
                      <td className="py-4">
                        {p.coughStatus && p.coughStatus !== "-" ? (
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full ${STATUS_STYLES[translateStatus(p.coughStatus)] || "bg-purple-100 text-purple-700"}`}>
                            {translateStatus(p.coughStatus)}
                          </span>
                        ) : (
                          <span className="text-muted font-bold">—</span>
                        )}
                      </td>
                      <td className="py-4 text-xs font-black">
                        {p.matrix && p.matrix !== "-" ? (!isNaN(parseFloat(p.matrix)) ? (parseFloat(p.matrix) > 1 && parseFloat(p.matrix) <= 100 ? parseFloat(p.matrix) : (parseFloat(p.matrix) <= 1 ? parseFloat(p.matrix) * 100 : 100)).toFixed(1) + "%" : p.matrix) : "—"}
                      </td>
                      <td className="py-4 text-xs font-bold text-muted whitespace-nowrap">{val(p.time)}</td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted text-sm font-bold">
                        {error ? "No records available." : "No records found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
