import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useRealtimeData from "../hooks/useRealtimeData"
import MedicalReportPrint from "../components/dashboard/MedicalReportPrint"
import { ENDPOINTS } from "../api/config"


const translateStatus = (status) => {
  if (!status) return "-";
  if (status.toUpperCase() === "PPOK" || status.toUpperCase() === "COPD") return "COPD";
  if (status.toUpperCase() === "NON-COPD" || status === "Sehat" || status === "NORMAL" || status === "Gejala Ringan") return "NON-COPD";
  return status;
}

const STATUS_STYLES = {
  "NORMAL":   { pill: "bg-green-100 text-green-600 dark:bg-green-900/30",   dot: "bg-green-500" },
  "MILD OBSTRUCTION":   { pill: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30",   dot: "bg-yellow-500" },
  "MODERATE OBSTRUCTION":   { pill: "bg-amber-100 text-amber-600 dark:bg-amber-900/30",   dot: "bg-amber-500" },
  "SEVERE OBSTRUCTION":     { pill: "bg-orange-100 text-orange-600 dark:bg-orange-900/30", dot: "bg-orange-500" },
  "VERY SEVERE OBSTRUCTION": { pill: "bg-red-100 text-red-600 dark:bg-red-900/30",        dot: "bg-red-500" },
  "TEST INVALID": { pill: "bg-gray-100 text-gray-600 dark:bg-gray-800/30",        dot: "bg-gray-500" },
  "OBSTRUCTIVE SUSPECT": { pill: "bg-red-100 text-red-600 dark:bg-red-900/30", dot: "bg-red-500" },
  "COPD": { pill: "bg-red-100 text-red-700 dark:bg-red-900/30", dot: "bg-red-500" },
  "NON-COPD": { pill: "bg-green-100 text-green-700 dark:bg-green-900/30", dot: "bg-green-500" },
  "Stable": { pill: "bg-green-100 text-green-600 dark:bg-green-900/30", dot: "bg-green-500" }
}

// Helper: show value or dash
const val = (v, suffix = "") => (v !== undefined && v !== null && v !== "") ? `${v}${suffix}` : "—"

const getSpiroText = (p) => {
  const statusUp = p.status?.toUpperCase() || "";
  if (statusUp.includes("INVALID") || statusUp.includes("TIDAK VALID")) return "TEST INVALID";
  if (statusUp.includes("SUSPEK") || statusUp.includes("OBSTRUCT")) return "OBSTRUCTIVE SUSPECT";
  
  const ratioFev1Fvc = p.ratio ? (p.ratio / 100) : 0;
  // If FEV1 is 0 but FVC is > 0, ratio is 0. 0 < 0.70 is true, but previously 0 > 0 was false.
  return (ratioFev1Fvc < 0.70 && (p.fvc > 0 || p.fev1 > 0)) ? "OBSTRUCTIVE SUSPECT" : "NORMAL";
}

const getFinalDiagnosis = (p) => {
  const statusUp = p.status?.toUpperCase() || "";
  if (statusUp.includes("INVALID") || statusUp.includes("TIDAK VALID")) {
    return { finalDiag: "TEST INVALID", badgeColor: "bg-gray-100 text-gray-600 border-gray-300" };
  }
  
  const ratioFev1Fvc = p.ratio ? (p.ratio / 100) : 0;
  const isObstructive = statusUp.includes("SUSPEK") || statusUp.includes("OBSTRUCT") || (ratioFev1Fvc < 0.70 && (p.fvc > 0 || p.fev1 > 0));
  let spiroScore = isObstructive ? 1 : 0;
  
  const rawCat = p.catScore && p.catScore !== "-" ? Number(p.catScore) : 0;
  const catNorm = Math.min(rawCat / 40.0, 1.0);
  
  let annScore = p.matrix && p.matrix !== "-" ? Number(p.matrix) : 0;
  if (annScore > 1 && annScore <= 100) annScore = annScore / 100;
  else if (annScore > 100) annScore = 1;
  
  const riskScore = (0.648 * spiroScore) + (0.230 * annScore) + (0.122 * catNorm);
  
  let riskLevel = "LOW";
  if (riskScore < 0.40) riskLevel = "LOW";
  else if (riskScore >= 0.40 && riskScore < 0.70) riskLevel = "MEDIUM";
  else riskLevel = "HIGH";
  
  const finalDiag = riskLevel === "LOW" ? "LOW RISK" : riskLevel === "MEDIUM" ? "MODERATE RISK" : "HIGH RISK";
  const badgeColor = riskLevel === "HIGH" ? 'bg-red-50 text-red-600 border-red-200' : riskLevel === "MEDIUM" ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-green-50 text-green-600 border-green-200';
  
  return { finalDiag, badgeColor, riskLevel };
}

export default function PatientsPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState("table")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const [isEditingPatient, setIsEditingPatient] = useState(false)
  const [editPatientForm, setEditPatientForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [selectedSpiro, setSelectedSpiro] = useState("All")
  const [selectedCough, setSelectedCough] = useState("All")
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'desc' })
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, patientId: null, spiroId: null, name: "" })
  const { patients, loading } = useRealtimeData()
  const error = null

  const spiroFilters = ["All", "NORMAL", "OBSTRUCTIVE SUSPECT", "TEST INVALID"]
  const coughFilters = ["All", "NON-COPD", "COPD", "UNKNOWN", "-"]

  const handleDeleteClick = (e, patientId, spiroId, name) => {
    e.stopPropagation()
    setDeleteModal({ isOpen: true, patientId, spiroId, name })
  }

  const confirmDelete = async () => {
    try {
      let success = false;
      const token = localStorage.getItem("token");

      // Only delete the specific spirometry/screening record (the session).
      // Do NOT delete the patient, as they might have other sessions.
      if (deleteModal.spiroId) {
        const resSpiro = await fetch(`${ENDPOINTS.spirometry}/${deleteModal.spiroId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (resSpiro.ok) success = true;
      }

      if (success) {
        // Data deleted. The useRealtimeData hook will automatically refresh the list within 5 seconds.
      } else {
        alert("Failed to delete patient. The data might have been already removed.")
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred while deleting.")
    } finally {
      setDeleteModal({ isOpen: false, patientId: null, spiroId: null, name: "" })
    }
  }

  const handleEditPatientStart = () => {
    setEditPatientForm({
      name: selected.name || "",
      age: selected.age || "",
      gender: selected.gender || "M",
      height: selected.height || "",
      weight: selected.weight || "",
      catScore: selected.catScore || ""
    })
    setIsEditingPatient(true)
  }

  const handleSavePatient = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem("token")
      const id = selected.patientId || selected.id || selected._id;
      
      const payload = {
        name: editPatientForm.name,
        age: editPatientForm.age,
        gender: editPatientForm.gender,
        height: editPatientForm.height ? Number(String(editPatientForm.height).replace(',', '.')) : null,
        weight: editPatientForm.weight ? Number(String(editPatientForm.weight).replace(',', '.')) : null,
        catScore: editPatientForm.catScore !== "" ? Number(String(editPatientForm.catScore).replace(',', '.')) : null
      }

      const res = await fetch(`${ENDPOINTS.patients}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      let spiroSuccess = true;
      const spiroId = selected.id || selected._id;
      if (spiroId && editPatientForm.catScore !== "") {
        const resSpiro = await fetch(`${ENDPOINTS.spirometry}/${spiroId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ catScore: Number(editPatientForm.catScore) })
        })
        if (!resSpiro.ok) spiroSuccess = false;
      }

      if (res.ok && spiroSuccess) {
        const updated = await res.json()
        setSelected({...selected, ...updated.data, catScore: editPatientForm.catScore !== "" ? Number(editPatientForm.catScore) : selected.catScore})
        setIsEditingPatient(false)
      } else {
        const errData = await res.json().catch(() => ({}))
        alert(errData.error || "Failed to update patient data")
      }
    } catch (err) {
      console.error(err)
      alert("Error updating patient")
    } finally {
      setSaving(false)
    }
  }

  let filtered = patients.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
    const matchSpiro = selectedSpiro === "All" || p.status === selectedSpiro
    const matchCough = selectedCough === "All" || translateStatus(p.coughStatus) === selectedCough
    return matchSearch && matchSpiro && matchCough
  })

  // Sorting Logic
  if (sortConfig !== null) {
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      
      // Handle missing/placeholder values
      if (aVal === "-" || aVal === undefined) aVal = ""
      if (bVal === "-" || bVal === undefined) bVal = ""
      
      // Handle numeric sorting for fields like fev1, fvc, ratio, etc
      if (['fev1', 'fvc', 'fev1Pred', 'fvcPred', 'ratio', 'matrix'].includes(sortConfig.key)) {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      }

      // Handle time sorting
      if (sortConfig.key === 'time') {
        aVal = new Date(aVal).getTime() || 0
        bVal = new Date(bVal).getTime() || 0
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // ─── Export to Excel (CSV) ───────────────────────────────────────────────────
  const exportToExcel = () => {
    const headers = ["ID", "Name", "Age", "Gender", "Height (cm)", "Weight (kg)", "CAT Score", "FEV1 (L)", "FVC (L)", "FEV1/FVC (%)", "Conf. Matrix Acc. (%)", "Status", "Time"]
    const rows = filtered.map(p => [
      val(p.id),
      val(p.name),
      val(p.age),
      val(p.gender),
      val(p.height),
      val(p.weight),
      val(p.catScore),
      val(p.fev1),
      val(p.fvc),
      val(p.ratio),
      val(p.matrix),
      val(p.status),
      val(p.time),
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `patients_report_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadCSV = (waveform, type, patientName) => {
    if (!waveform || waveform.length === 0) {
      alert("Belum ada data untuk diunduh!");
      return;
    }
    // Add sep=, so Excel automatically splits columns regardless of regional settings
    let csvContent = "data:text/csv;charset=utf-8,sep=,\nSampleIndex,Value\n";
    waveform.forEach((val, index) => {
      csvContent += `${index},${val}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${patientName?.replace(/\s+/g, '_') || 'patient'}_${type}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Patients</h1>
          <p className="text-sm text-muted mt-1">Respiratory sensor readings &amp; AI classification results</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode("table")} 
              className={`p-2 rounded-lg transition-colors flex items-center justify-center ${viewMode === "table" ? "bg-white dark:bg-gray-700 shadow-sm text-primary" : "text-muted hover:text-gray-700 dark:hover:text-gray-300"}`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-sm">table_rows</span>
            </button>
            <button 
              onClick={() => setViewMode("grid")} 
              className={`p-2 rounded-lg transition-colors flex items-center justify-center ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-primary" : "text-muted hover:text-gray-700 dark:hover:text-gray-300"}`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
            </button>
          </div>
          <button
            onClick={() => navigate("/lcd")}
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Patient
          </button>
          
          <button
            onClick={exportToExcel}
            disabled={filtered.length === 0}
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Excel
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden">
        {[
          { label: "Total Patients", value: patients.length,                                                icon: "group",         color: "text-teal-500",   bg: "bg-teal-50 dark:bg-teal-900/20" },
          { label: "Obstructive Suspect",       value: patients.filter(p => p.ratio > 0 && p.ratio < 70).length,           icon: "emergency",     color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/20" },
          { label: "Normal",         value: patients.filter(p => (p.ratio >= 70 || !p.ratio)).length,             icon: "check_circle",  color: "text-green-500",  bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "NON-COPD",  value: patients.filter(p => translateStatus(p.coughStatus) === "NON-COPD").length, icon: "health_and_safety", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "COPD",  value: patients.filter(p => translateStatus(p.coughStatus) === "COPD").length, icon: "coronavirus", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-surface-container-dark p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-xl">{s.icon}</span>
            </div>
            <div>
              <h3 className="text-2xl font-black">{s.value}</h3>
              <p className="text-xs font-bold text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter Area */}
      <div className="bg-white dark:bg-surface-container-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-border-dark flex flex-col md:flex-row gap-4 items-center print:hidden">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient name..."
            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex w-full md:w-auto gap-3 flex-wrap sm:flex-nowrap">
          {/* Spiro Dropdown */}
          <div className="relative flex-1 md:w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 text-[18px]">air</span>
            <select
              value={selectedSpiro}
              onChange={(e) => setSelectedSpiro(e.target.value)}
              className="w-full bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 text-teal-700 dark:text-teal-400 rounded-xl pl-10 pr-8 py-3 text-sm font-bold outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-teal-500/30"
            >
              {spiroFilters.map(f => (
                <option key={f} value={f}>{f === "All" ? "Spirometry (All)" : f}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 text-[18px] pointer-events-none">expand_more</span>
          </div>

          {/* Cough Dropdown */}
          <div className="relative flex-1 md:w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 text-[18px]">graphic_eq</span>
            <select
              value={selectedCough}
              onChange={(e) => setSelectedCough(e.target.value)}
              className="w-full bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl pl-10 pr-8 py-3 text-sm font-bold outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-purple-500/30"
            >
              {coughFilters.map(f => (
                <option key={f} value={f}>{f === "All" ? "Cough Analysis (All)" : f}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 text-[18px] pointer-events-none">expand_more</span>
          </div>
        </div>

      </div>

      {/* API banner */}
      {error && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 px-5 py-3 rounded-2xl text-sm font-bold">
          <span className="material-symbols-outlined text-amber-500 shrink-0">wifi_off</span>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-surface-container-dark rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark p-10 flex flex-col items-center gap-4 print:hidden">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-sm font-bold text-muted">Fetching patient records from API…</p>
        </div>
      )}

      {/* Data View */}
      {!loading && viewMode === "table" && (
        <div className="bg-white dark:bg-surface-container-dark rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark overflow-x-auto print:hidden">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="text-[10px] font-extrabold text-muted uppercase tracking-wider border-b border-gray-100 dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/20">
                {[
                  { key: "name", label: "Patient" },
                  { key: "age", label: "Age / Sex" },
                  { key: "height", label: "Height (cm)" },
                  { key: "weight", label: "Weight (kg)" },
                  { key: "bmi", label: "BMI" },
                  { key: "catScore", label: "CAT Score" },
                  { key: "fev1", label: "FEV1 (L)" },
                  { key: "fev1Pred", label: "Pred FEV1" },
                  { key: "fvc", label: "FVC (L)" },
                  { key: "fvcPred", label: "Pred FVC" },
                  { key: "ratio", label: "FEV1/FVC" },
                  { key: "status", label: "Spiro Status" },
                  { key: "matrix", label: "Cough Score" },
                  { key: "coughStatus", label: "Cough Status" },
                  { key: "finalDiag", label: "Final Screening" },
                  { key: "time", label: "Time" },
                  { key: "actions", label: "" },
                ].map((col, idx) => (
                  <th 
                    key={col.key} 
                    className={`py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none ${idx === 0 ? "px-6" : ""}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1 group">
                      {col.label}
                      <span className={`material-symbols-outlined text-[14px] ${sortConfig.key === col.key ? "text-primary opacity-100" : "text-muted opacity-0 group-hover:opacity-50"}`}>
                        {sortConfig.key === col.key && sortConfig.direction === 'desc' ? "arrow_downward" : "arrow_upward"}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const style = STATUS_STYLES[p.status] || { pill: "bg-gray-100 text-gray-600 dark:bg-gray-800/30", dot: "bg-gray-500" }
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(selected?.id === p.id ? null : p)}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer transition-colors last:border-0"
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                          {p.name?.charAt(0) ?? "?"}
                        </div>
                        <span className="font-bold text-sm whitespace-nowrap">{val(p.name)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-bold text-muted whitespace-nowrap">{val(p.age)} / {val(p.gender)}</td>
                    <td className="py-4 text-sm font-bold">{val(p.height)}</td>
                    <td className="py-4 text-sm font-bold">{val(p.weight)}</td>
                    <td className="py-4 text-sm font-bold">
                      {p.height && p.weight ? (p.weight / ((p.height / 100) ** 2)).toFixed(1) : "—"}
                    </td>
                    <td className="py-4 text-sm font-black text-pink-500">{val(p.catScore)}</td>
                    <td className="py-4 text-sm font-black text-teal-600 dark:text-teal-400">{val(p.fev1)}</td>
                    <td className="py-4 text-sm font-bold text-muted">{val(p.fev1Pred)}</td>
                    <td className="py-4 text-sm font-black text-blue-600 dark:text-blue-400">{val(p.fvc)}</td>
                    <td className="py-4 text-sm font-bold text-muted">{val(p.fvcPred)}</td>
                    {/* FEV1/FVC — display direct from API field */}
                    <td className="py-4 text-sm font-black">
                      {p.ratio !== undefined && p.ratio !== null && p.ratio !== 0
                        ? <span className={`font-black ${p.ratio < 70 ? "text-red-500" : p.ratio < 80 ? "text-amber-500" : "text-green-500"}`}>{p.ratio}%</span>
                        : <span className="text-muted font-bold">—</span>
                      }
                    </td>
                    {/* Spiro Status */}
                    <td className="py-4">
                      {(() => {
                        const spiroText = getSpiroText(p);
                        const style = STATUS_STYLES[spiroText] || STATUS_STYLES["Normal"] || { pill: "bg-gray-100 text-gray-600", dot: "bg-gray-500" };
                        return (
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${style.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                            {spiroText}
                          </span>
                        );
                      })()}
                    </td>
                    {/* Cough Score */}
                    <td className="py-4 text-sm font-black">
                      {p.matrix !== undefined && p.matrix !== null && p.matrix !== "-"
                        ? <span className="text-purple-500">{!isNaN(parseFloat(p.matrix)) ? (parseFloat(p.matrix) > 1 && parseFloat(p.matrix) <= 100 ? parseFloat(p.matrix) : (parseFloat(p.matrix) <= 1 ? parseFloat(p.matrix) * 100 : 100)).toFixed(1) + "%" : p.matrix}</span>
                        : <span className="text-muted font-bold">—</span>
                      }
                    </td>
                    {/* Cough Status */}
                    <td className="py-4">
                      {p.coughStatus && p.coughStatus !== "-" ? (() => {
                        const translated = translateStatus(p.coughStatus);
                        const style = STATUS_STYLES[translated] || STATUS_STYLES["Normal"] || { pill: "bg-gray-100 text-gray-600", dot: "bg-gray-500" };
                        return (
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${style.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                            {translated}
                          </span>
                        );
                      })() : (
                        <span className="text-xs font-bold text-muted">—</span>
                      )}
                    </td>
                    {/* Final Diagnosis */}
                    <td className="py-4">
                      {p.status !== "Unknown" && p.status !== "-" ? (() => {
                        const { finalDiag, badgeColor } = getFinalDiagnosis(p);
                        return (
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-md border ${badgeColor}`}>
                            {finalDiag}
                          </span>
                        );
                      })() : (
                         <span className="text-xs font-bold text-muted">—</span>
                      )}
                    </td>
                    <td className="py-4 text-xs font-bold text-muted whitespace-nowrap">{val(p.time)}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={(e) => handleDeleteClick(e, p.patientId, p.id, p.name)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                        title="Delete Patient"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted text-sm font-bold">
                    No patients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:hidden">
          {filtered.map((p) => {
            const spiroStyle = STATUS_STYLES[p.status] || STATUS_STYLES.NORMAL || { pill: "bg-gray-100 text-gray-600", dot: "bg-gray-500" };
            const coughTranslated = translateStatus(p.coughStatus);
            const coughStyle = STATUS_STYLES[coughTranslated] || STATUS_STYLES.NORMAL || { pill: "bg-gray-100 text-gray-600", dot: "bg-gray-500" };
            
            const { finalDiag, badgeColor } = getFinalDiagnosis(p);

            return (
              <div 
                key={p.id}
                onClick={() => setSelected(selected?.id === p.id ? null : p)}
                className="bg-white dark:bg-surface-container-dark border border-gray-100 dark:border-border-dark rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex flex-col gap-4 group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                      {p.name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface dark:text-on-surface-dark line-clamp-1">{val(p.name)}</h3>
                      <p className="text-xs font-semibold text-muted">{val(p.age)}y • {val(p.gender)} • {val(p.weight)}kg • CAT: <span className="text-pink-500 font-bold">{val(p.catScore)}</span></p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] text-muted font-bold whitespace-nowrap">{val(p.time)?.split(',')[0]}</span>
                    <button
                      onClick={(e) => handleDeleteClick(e, p.patientId, p.id, p.name)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                      title="Delete Patient"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                    <span className="block text-[10px] font-extrabold text-muted uppercase mb-1">Spirometry</span>
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${STATUS_STYLES[getSpiroText(p)]?.pill || STATUS_STYLES.NORMAL.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[getSpiroText(p)]?.dot || STATUS_STYLES.NORMAL.dot}`}></span>
                      {getSpiroText(p)}
                    </span>
                    <div className="flex justify-between mt-2 text-[10px] font-bold">
                      <span className="text-muted">FEV1/FVC</span>
                      <span className={p.ratio < 70 ? "text-red-500" : "text-green-500"}>{val(p.ratio, "%")}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                    <span className="block text-[10px] font-extrabold text-muted uppercase mb-1">Cough Sensor</span>
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${coughStyle.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${coughStyle.dot}`}></span>
                      {coughTranslated || "—"}
                    </span>
                    <div className="flex justify-between mt-2 text-[10px] font-bold">
                      <span className="text-muted">Probability</span>
                      <span className="text-purple-500">{p.matrix && p.matrix !== "-" ? (!isNaN(parseFloat(p.matrix)) ? (parseFloat(p.matrix) > 1 && parseFloat(p.matrix) <= 100 ? parseFloat(p.matrix) : (parseFloat(p.matrix) <= 1 ? parseFloat(p.matrix) * 100 : 100)).toFixed(1) + "%" : p.matrix) : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-auto p-2 rounded-xl border ${badgeColor}`}>
                   <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60 mb-0.5">Final Screening</p>
                   <p className="text-xs font-bold leading-tight">{finalDiag}</p>
                </div>
              </div>
            )
          })}
          
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted text-sm font-bold bg-white dark:bg-surface-container-dark rounded-3xl border border-gray-100 dark:border-border-dark">
              No patients found matching your search.
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (() => {
        const patientHistory = patients.filter(p => p.patientId === selected.patientId);
        const displayExams = [selected]; // Only show the clicked exam

        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-surface-container-dark border border-gray-100 dark:border-border-dark rounded-3xl p-6 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-muted uppercase tracking-widest">Medical Record</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-bold text-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                  PDF
                </button>
                <button onClick={() => { setSelected(null); setIsEditingPatient(false); }} className="p-2 rounded-xl text-muted hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-3xl shrink-0">
                  {selected.name?.charAt(0) ?? "?"}
                </div>
                {isEditingPatient ? (
                  <div className="flex flex-col gap-2">
                    <input type="text" className="text-2xl font-extrabold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-1 outline-none w-full max-w-sm focus:border-primary/50" value={editPatientForm.name} onChange={e => setEditPatientForm({...editPatientForm, name: e.target.value})} placeholder="Patient Name" />
                    <div className="flex items-center gap-2 text-sm text-muted font-bold flex-wrap">
                      <input type="number" className="w-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 outline-none focus:border-primary/50" value={editPatientForm.age} onChange={e => setEditPatientForm({...editPatientForm, age: e.target.value})} placeholder="Age" /> yrs · 
                      <select className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 outline-none focus:border-primary/50" value={editPatientForm.gender} onChange={e => setEditPatientForm({...editPatientForm, gender: e.target.value})}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select> · 
                      <input type="number" className="w-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 outline-none focus:border-primary/50" value={editPatientForm.height} onChange={e => setEditPatientForm({...editPatientForm, height: e.target.value})} placeholder="cm" /> cm · 
                      <input type="number" className="w-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 outline-none focus:border-primary/50" value={editPatientForm.weight} onChange={e => setEditPatientForm({...editPatientForm, weight: e.target.value})} placeholder="kg" /> kg · CAT: 
                      <input type="number" className="w-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 outline-none focus:border-primary/50" value={editPatientForm.catScore} onChange={e => setEditPatientForm({...editPatientForm, catScore: e.target.value})} placeholder="Score" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-extrabold">{val(selected.name)}</h2>
                    <p className="text-sm text-muted font-semibold mt-1">
                      {val(selected.age)} yrs · {selected.gender === "M" ? "Male" : selected.gender === "F" ? "Female" : val(selected.gender)} · {val(selected.height)} cm · {val(selected.weight)} kg · BMI: {selected.height && selected.weight ? (selected.weight / ((selected.height / 100) ** 2)).toFixed(1) : "—"} · CAT: <span className="text-pink-500 font-bold">{val(selected.catScore)}</span>
                    </p>
                    <p className="text-xs font-bold text-primary bg-primary/10 inline-block px-2 py-1 rounded-md mt-2">
                      Total Examinations: {patientHistory.length}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons for Edit */}
              <div className="flex gap-2">
                {isEditingPatient ? (
                  <>
                    <button onClick={() => setIsEditingPatient(false)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-bold transition-colors">Cancel</button>
                    <button onClick={handleSavePatient} disabled={saving} className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-colors flex items-center gap-2">
                      {saving ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div> Saving...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[16px]">save</span> Save</>
                      )}
                    </button>
                  </>
                ) : (
                  <button onClick={handleEditPatientStart} className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                  </button>
                )}
              </div>
            </div>

            {/* Examination Details */}
            <div className="space-y-6">
              {displayExams.map((exam, idx) => {
                const spiroStyle = STATUS_STYLES[exam.status] || STATUS_STYLES.NORMAL || { pill: "bg-gray-100", dot: "bg-gray-500" };
                const coughTranslated = translateStatus(exam.coughStatus);
                const coughStyle = STATUS_STYLES[coughTranslated] || STATUS_STYLES.NORMAL || { pill: "bg-gray-100", dot: "bg-gray-500" };
                
                const { finalDiag, riskLevel } = getFinalDiagnosis(exam);

                return (
                  <div key={exam.id || idx} className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800/30 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-muted">medical_information</span>
                        Examination Record
                      </h3>
                      <span className="text-xs font-black text-muted">{val(exam.time)}</span>
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Spirometry */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Spirometry Data</h4>
                          {exam.spiroWaveform && exam.spiroWaveform.length > 0 && (
                            <button 
                              onClick={() => handleDownloadCSV(exam.spiroWaveform, 'spirometry', exam.name)}
                              className="text-[9px] uppercase font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[10px]">download</span>
                              CSV
                            </button>
                          )}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {[
                              { label: "FEV1",     value: val(exam.fev1, " L"),    color: "text-teal-500" },
                              { label: "Pred FEV1",value: val(exam.fev1Pred, " L"), color: "text-muted" },
                              { label: "FVC",      value: val(exam.fvc, " L"),     color: "text-blue-500" },
                              { label: "Pred FVC", value: val(exam.fvcPred, " L"),  color: "text-muted" },
                            ].map((row, i) => (
                              <div key={i} className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted">{row.label}</span>
                                <span className={`text-sm font-black ${row.color}`}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                             <span className="text-xs font-bold text-muted">FEV1/FVC</span>
                             <span className={`text-sm font-black ${exam.ratio < 70 ? "text-red-500" : exam.ratio < 80 ? "text-amber-500" : "text-green-500"}`}>
                               {val(exam.ratio, "%")}
                             </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                             <span className="text-[10px] font-bold text-muted">Peak Flow: <span className="text-gray-800 dark:text-gray-200">{val(exam.peakFlow, " L/s")}</span></span>
                             <span className={`text-[10px] font-bold ${exam.blowQuality === "Valid" ? "text-green-500" : "text-amber-500"}`}>
                               {val(exam.blowQuality)}
                             </span>
                          </div>
                        </div>
                      </div>

                      {/* Cough Sensor */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Cough Sensor Data</h4>
                          {exam.coughWaveform && exam.coughWaveform.length > 0 && (
                            <button 
                              onClick={() => handleDownloadCSV(exam.coughWaveform, 'cough_audio', exam.name)}
                              className="text-[9px] uppercase font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[10px]">download</span>
                              CSV
                            </button>
                          )}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex flex-col justify-center h-full">
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-muted">Probability</span>
                             <span className="text-sm font-black text-purple-500">{exam.matrix && exam.matrix !== "-" ? (!isNaN(parseFloat(exam.matrix)) ? (parseFloat(exam.matrix) > 1 && parseFloat(exam.matrix) <= 100 ? parseFloat(exam.matrix) : (parseFloat(exam.matrix) <= 1 ? parseFloat(exam.matrix) * 100 : 100)).toFixed(1) + "%" : exam.matrix) : "—"}</span>
                           </div>
                           <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                             <span className="text-xs font-bold text-muted">Audio Result</span>
                             <span className={`text-xs font-bold ${coughTranslated === "COPD" ? "text-red-500" : "text-green-500"}`}>
                               {translateStatus(val(exam.coughStatus))}
                             </span>
                           </div>
                        </div>
                      </div>

                      {/* Diagnosis */}
                      <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Diagnosis Data</h4>
                        <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex flex-col gap-3 h-full">
                          <div>
                            {(() => {
                                const spiroText = getSpiroText(exam);
                                const spiroStyle = STATUS_STYLES[spiroText] || STATUS_STYLES["Normal"] || { pill: "bg-gray-100", dot: "bg-gray-500" };
                                return (
                                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${spiroStyle.pill}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${spiroStyle.dot}`}></span>
                                    {spiroText}
                                  </span>
                                );
                              })()}
                          </div>
                          <div>
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2 py-1 rounded-md ${coughStyle.pill}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${coughStyle.dot}`}></span>
                              {translateStatus(val(exam.coughStatus))}
                            </span>
                          </div>
                          <div>
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2 py-1 rounded-md bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400`}>
                              <span className={`w-1.5 h-1.5 rounded-full bg-pink-500`}></span>
                              CAT SCORE: {val(exam.catScore)}
                            </span>
                          </div>
                          <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
                             <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-60 mb-0.5">Final Screening</p>
                             <p className={`text-xs font-bold leading-tight ${riskLevel === 'HIGH' ? 'text-red-600' : riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-green-600'}`}>{finalDiag}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CDSS Decision Logic Explanation */}
                    <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
                        <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider">CDSS Decision Tree Logic</h4>
                      </div>
                      <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/10">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                          The <strong>Clinical Decision Support System (CDSS)</strong> fuses multi-modal data using an <strong>AHP-based Forward Chaining Model</strong>:
                        </p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 font-medium">
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-green-500 text-[14px] mt-0.5">check_circle</span>
                            <span><strong>1. Parameter Weights:</strong> Spirometry (64.8%), Cough ANN Score (23.0%), CAT Score (12.2%).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-[14px] mt-0.5">calculate</span>
                            <span><strong>2. Risk Calculation:</strong> Sums normalized parameter values according to AHP weights to produce a final Risk Score (0.00 - 1.00).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-red-500 text-[14px] mt-0.5">warning</span>
                            <span><strong>3. Final Screening:</strong> Forward Chaining outputs LOW RISK (Score &lt; 0.40), MODERATE RISK (0.40 - 0.70), or HIGH RISK (&ge; 0.70).</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          </div>
        </div>
        );
      })()}

      <MedicalReportPrint exam={selected} />

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-container-dark border border-gray-100 dark:border-border-dark rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-md animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
               <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-black mb-2">Delete Patient?</h3>
            <p className="text-muted text-sm mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-gray-200">{deleteModal.name}</span>? 
              This will also permanently delete all associated spirometry and cough examination records. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, patientId: null, spiroId: null, name: "" })}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
