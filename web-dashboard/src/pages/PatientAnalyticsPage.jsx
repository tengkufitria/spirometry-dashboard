import { useState, useEffect } from "react";
import { ENDPOINTS } from "../api/config";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

const translateStatus = (status) => {
  if (!status) return "-";
  if (status.toUpperCase() === "PPOK" || status.toUpperCase() === "COPD") return "COPD";
  if (status.toUpperCase() === "NON-COPD" || status === "Sehat" || status === "NORMAL" || status === "Gejala Ringan") return "NON-COPD";
  return status;
}

export default function PatientAnalyticsPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [editingSpiroId, setEditingSpiroId] = useState(null);
  const [editSpiroForm, setEditSpiroForm] = useState({});
  const [editingCoughId, setEditingCoughId] = useState(null);
  const [editCoughForm, setEditCoughForm] = useState({});
  
  // Manual responsive width to fix Recharts React 19 ResponsiveContainer bug
  const [chartWidth, setChartWidth] = useState(800);
  const [halfChartWidth, setHalfChartWidth] = useState(400);

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('analytics-container');
      if (container) {
        const fullWidth = Math.max(container.clientWidth - 48, 800); // 48px for p-6
        setChartWidth(fullWidth);
        setHalfChartWidth(Math.max((container.clientWidth - 72) / 2, 400)); // split in 2 cols + gap
      }
    };
    handleResize();
    const timeout = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [historyData]);

  // Fetch all patients for dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Add limit=500 to get all patients for the dropdown instead of default 10
        const res = await fetch(`${ENDPOINTS.patients}?limit=500`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const json = await res.json();
          setPatients(json.data || json);
        }
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };
    fetchPatients();
  }, []);

  // Fetch history when a patient is selected
  useEffect(() => {
    if (!selectedPatientId) {
      setHistoryData(null);
      return;
    }
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(ENDPOINTS.patientHistory(selectedPatientId), {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const json = await res.json();
          setHistoryData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [selectedPatientId]);

  const handleEditSpiroStart = (spiro) => {
    setEditingSpiroId(spiro._id || spiro.id);
    setEditSpiroForm({
      diagnosis: spiro.diagnosis || ""
    });
  };

  const handleSaveSpiro = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${ENDPOINTS.spirometry}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(editSpiroForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setHistoryData(prev => ({
          ...prev,
          spirometry: prev.spirometry.map(s => (s._id || s.id) === id ? {...s, ...updated.data} : s)
        }));
        setEditingSpiroId(null);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update spirometry log");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating spirometry");
    }
  };

  const handleEditCoughStart = (cough) => {
    setEditingCoughId(cough._id || cough.id);
    setEditCoughForm({
      result: cough.result || ""
    });
  };

  const handleSaveCough = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${ENDPOINTS.cough}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(editCoughForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setHistoryData(prev => ({
          ...prev,
          cough: prev.cough.map(c => (c._id || c.id) === id ? {...c, ...updated.data} : c)
        }));
        setEditingCoughId(null);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update cough log");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating cough");
    }
  };

  const sortedSpirometry = [...(historyData?.spirometry || [])]
    .sort((a,b) => new Date(a.recordedAt || a.createdAt) - new Date(b.recordedAt || b.createdAt));

  let chartData = sortedSpirometry.map((item, index) => {
    const fev1Num = parseFloat(item.fev1);
    const fvcNum = parseFloat(item.fvc);
    
    let ratioVal = null;
    if (item.ratio !== undefined && item.ratio !== null) {
      ratioVal = parseFloat(item.ratio);
    } else if (!isNaN(fev1Num) && !isNaN(fvcNum) && fvcNum > 0) {
      ratioVal = fev1Num / fvcNum;
    }
    
    let finalRatio = null;
    if (ratioVal !== null && !isNaN(ratioVal)) {
      finalRatio = Number((ratioVal * 100).toFixed(1));
    }

    return {
      name: `Session ${index + 1}`,
      session: `S${index + 1}`,
      fullDate: new Date(item.recordedAt || item.createdAt).toLocaleString(),
      date: new Date(item.recordedAt || item.createdAt).toLocaleString(),
      time: item.recordedAt || item.createdAt ? new Date(item.recordedAt || item.createdAt).toLocaleTimeString() : "-",
      fev1: isNaN(parseFloat(item.fev1)) ? null : parseFloat(item.fev1),
      fvc: isNaN(parseFloat(item.fvc)) ? null : parseFloat(item.fvc),
      ratio: finalRatio,
      diagnosis: item.diagnosis
    };
  }) || [];

  console.table(chartData);

  console.log("=== RAW SPIROMETRY ===");
  console.table(
    sortedSpirometry.map((x) => ({
      createdAt: x.createdAt,
      recordedAt: x.recordedAt,
      fev1: x.fev1,
      fvc: x.fvc,
      ratio: ((parseFloat(x.fev1) / parseFloat(x.fvc)) * 100).toFixed(1)
    }))
  );

  // Generate Cough Score Trend Data
  const sortedCough = [...(historyData?.cough || [])]
    .sort((a,b) => new Date(a.recordedAt || a.createdAt) - new Date(b.recordedAt || b.createdAt));

  const coughChartData = sortedCough.map((item, index) => {
    const val = parseFloat(item.confidence);
    let perc = null;
    if (!isNaN(val)) {
      perc = val > 1 && val <= 100 ? val : (val <= 1 ? val * 100 : 100);
    }
    return {
      name: `Session ${index + 1}`,
      session: `S${index + 1}`,
      fullDate: new Date(item.recordedAt || item.createdAt).toLocaleString(),
      date: new Date(item.recordedAt || item.createdAt).toLocaleString(),
      score: perc !== null ? Number(perc.toFixed(1)) : null,
      result: translateStatus(item.result)
    };
  }) || [];

  console.table(coughChartData);

  const CHART_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

  console.log("CHART DATA FINAL");
  console.table(
    chartData.map((c) => ({
      session: c.session,
      ratio: c.ratio,
    }))
  );

  // === TES EKSTREM SEMENTARA ===
  // Ganti `false` menjadi `true` di bawah ini untuk melihat apakah 
  // grafik Recharts bisa render zig-zag. Jika zig-zag muncul,
  // maka komponen sudah berjalan normal dan data aslinya yang salah.
  const ENABLE_EXTREME_TEST = false; 

  if (ENABLE_EXTREME_TEST) {
    chartData = [
      { session: 1, ratio: 10, fullDate: "Test 1" },
      { session: 2, ratio: 90, fullDate: "Test 2" },
      { session: 3, ratio: 20, fullDate: "Test 3" },
      { session: 4, ratio: 80, fullDate: "Test 4" }
    ];
    console.log("USING EXTREME TEST DATA");
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Patient Analytics</h1>
          <p className="text-sm text-muted mt-1">Track respiratory health progress over time</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex flex-col gap-4">
        <div className="relative flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-2xl">person_search</span>
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search patient by name..." 
              value={searchTerm} 
              onChange={(e) => { 
                setSearchTerm(e.target.value); 
                setShowDropdown(true); 
                if (e.target.value === "") setSelectedPatientId("");
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {showDropdown && searchTerm && (
              <div className="absolute z-50 top-full mt-2 w-full max-h-60 overflow-y-auto bg-white dark:bg-gray-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                {patients.filter(p => (p.name || "").toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50).map((p, idx) => (
                  <div 
                    key={p._id || p.id || idx} 
                    onClick={() => { 
                      setSelectedPatientId(p._id || p.id); 
                      setSearchTerm(p.name); 
                      setShowDropdown(false); 
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700/50 last:border-0 font-semibold text-sm transition-colors"
                  >
                    {p.name}
                  </div>
                ))}
                {patients.filter(p => (p.name || "").toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-muted text-sm font-semibold text-center">No patients found</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {(() => {
          const selectedPatient = patients.find(p => (p._id || p.id) === selectedPatientId);
          if (!selectedPatient) return (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-80 animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-primary">manage_search</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Search a Patient</h3>
              <p className="text-sm font-medium text-muted mt-2 max-w-sm leading-relaxed">
                Type a patient's name in the search box above to view their comprehensive respiratory health progress, spirometry trends, and cough analysis history.
              </p>
            </div>
          );
          const bmi = selectedPatient.height && selectedPatient.weight 
            ? (selectedPatient.weight / ((selectedPatient.height / 100) ** 2)).toFixed(1) 
            : null;
            
          return (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted font-bold">Age:</span>
                <span className="font-black">{selectedPatient.age || '—'} yrs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted font-bold">Gender:</span>
                <span className="font-black">{selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : selectedPatient.gender || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted font-bold">Height:</span>
                <span className="font-black">{selectedPatient.height || '—'} cm</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted font-bold">Weight:</span>
                <span className="font-black">{selectedPatient.weight || '—'} kg</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-lg">
                <span className="text-primary font-bold">BMI:</span>
                <span className="font-black text-primary">{bmi || '—'}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {loading && (
        <div className="flex justify-center p-10">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      )}

      {/* Analytics Content */}
      {!loading && historyData && (
        <div id="analytics-container" className="flex flex-col gap-6 w-full">
          
          <div className="w-full bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark overflow-x-auto">
            <h3 className="text-lg font-extrabold mb-6">Spirometry Progress (FEV1/FVC Ratio)</h3>
            {chartData.length > 0 ? (
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="session" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis type="number" domain={[0, 100]} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value, name) => {
                        if (value === null || value === undefined || isNaN(value)) return ["-", name];
                        return [`${Number(value).toFixed(1)}%`, "FEV1/FVC Ratio"];
                      }}
                      labelFormatter={(label, props) =>
                        props?.[0]?.payload?.fullDate || label
                      }
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                    <Line type="monotone" name="FEV1/FVC Ratio" dataKey="ratio" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} connectNulls={true} label={{ position: "top", formatter: (v) => `${v}%` }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center text-muted font-semibold">
                No spirometry data available for this patient.
              </div>
            )}
          </div>

          {/* Analytics Content Grid */}
          <div className="flex flex-col gap-6 mt-6">
            
            {/* Cough Score Trend Chart */}
            <div className="bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark overflow-x-auto">
              <h3 className="text-lg font-extrabold mb-2">Cough Score Trend</h3>
              <p className="text-sm text-muted mb-6">Monitoring the AI cough analysis score over time.</p>
              {coughChartData.length > 0 ? (
                <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={coughChartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="session" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} dy={10} />
                      <YAxis type="number" domain={[0, 100]} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value, name, props) => [`Probability: ${value !== null && value !== undefined ? value.toFixed(1) + '%' : '-'} (${props.payload.result})`, "Cough Score"]}
                        labelFormatter={(label, props) => props?.[0]?.payload?.fullDate || label}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                      <Line 
                        type="monotone" 
                        name="Cough Score" 
                        dataKey="score" 
                        stroke="#f43f5e" 
                        strokeWidth={3} 
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }} 
                        connectNulls={true}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-[350px] flex items-center justify-center text-muted font-semibold">
                  No cough analysis data available.
                </div>
              )}
            </div>

          </div>
          
          {/* History Timelines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* Spirometry Log */}
            <div className="bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex-1">
              <h3 className="text-lg font-extrabold mb-6">Spirometry Log</h3>
              <div className="flex flex-col gap-4">
                {sortedSpirometry.length > 0 ? [...sortedSpirometry].reverse().map((s, idx) => {
                  const i = historyData.spirometry.length - 1 - idx; // Keep original index for timeline
                  const date = s.recordedAt || s.createdAt ? new Date(s.recordedAt || s.createdAt).toLocaleDateString() : "-";
                  let color = "bg-gray-100 text-gray-600 border-gray-200";
                  const diag = s.diagnosis?.toUpperCase() || "UNKNOWN";
                  
                  if (diag.includes("PPOK") || diag.includes("SEVERE") || diag.includes("OBSTRUCTIVE")) color = "bg-red-50 text-red-600 border-red-200";
                  else if (diag.includes("RESTRICTIVE") || diag.includes("MILD") || diag.includes("GEJALA")) color = "bg-amber-50 text-amber-600 border-amber-200";
                  else if (diag === "NORMAL" || diag === "SEHAT") color = "bg-green-50 text-green-600 border-green-200";
                  
                  return (
                    <div key={s._id || i} className="flex gap-4 relative">
                      {/* Timeline line */}
                      {i !== historyData.spirometry.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-[-16px] w-0.5 bg-gray-100 dark:bg-gray-800"></div>
                      )}
                      
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 z-10 border border-blue-100">
                        <span className="material-symbols-outlined text-[16px] text-blue-500">air</span>
                      </div>
                      
                      <div className={`flex-1 p-4 rounded-2xl border ${color} group`}>
                        <div className="flex justify-between items-start mb-1">
                          {editingSpiroId === (s._id || s.id) ? (
                            <input 
                              type="text" 
                              value={editSpiroForm.diagnosis} 
                              onChange={e => setEditSpiroForm({...editSpiroForm, diagnosis: e.target.value})} 
                              className="text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 w-full mr-2 outline-none"
                              placeholder="Diagnosis"
                            />
                          ) : (
                            <h4 className="font-bold text-sm">{diag}</h4>
                          )}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs opacity-70 font-medium">{date}</span>
                            {editingSpiroId === (s._id || s.id) ? (
                              <button onClick={() => handleSaveSpiro(s._id || s.id)} className="text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 p-1 rounded transition-colors"><span className="material-symbols-outlined text-[14px]">save</span></button>
                            ) : (
                              <button onClick={() => handleEditSpiroStart(s)} className="opacity-0 group-hover:opacity-100 text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 p-1 rounded transition-opacity"><span className="material-symbols-outlined text-[14px]">edit</span></button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs opacity-90 font-medium">
                          FEV1: {s.fev1 ? parseFloat(s.fev1).toFixed(2) : '-'} L &bull; FVC: {s.fvc ? parseFloat(s.fvc).toFixed(2) : '-'} L &bull; Ratio: {s.fev1 && s.fvc && parseFloat(s.fvc) > 0 ? ((parseFloat(s.fev1) / parseFloat(s.fvc)) * 100).toFixed(1) : (s.ratio ? (parseFloat(s.ratio) * 100).toFixed(1) : '-')}%
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center p-6 text-sm text-muted">No spirometry history found.</div>
                )}
              </div>
            </div>

            {/* Cough Analysis Log */}
            <div className="bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark flex-1">
              <h3 className="text-lg font-extrabold mb-6">Cough Analysis Log</h3>
              <div className="flex flex-col gap-4">
                {sortedCough.length > 0 ? [...sortedCough].reverse().map((c, idx) => {
                  const i = historyData.cough.length - 1 - idx; // Keep original index for timeline
                  const date = c.recordedAt || c.createdAt ? new Date(c.recordedAt || c.createdAt).toLocaleDateString() : "-";
                  const translatedResult = translateStatus(c.result);
                  let color = "bg-gray-100 text-gray-600 border-gray-200";
                  if (translatedResult === "COPD") color = "bg-red-50 text-red-600 border-red-200";
                  else if (translatedResult === "NON-COPD") color = "bg-green-50 text-green-600 border-green-200";
                  
                  return (
                    <div key={c._id || i} className="flex gap-4 relative">
                      {/* Timeline line */}
                      {i !== historyData.cough.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-[-16px] w-0.5 bg-gray-100 dark:bg-gray-800"></div>
                      )}
                      
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 z-10 border border-purple-100">
                        <span className="material-symbols-outlined text-[16px] text-purple-500">graphic_eq</span>
                      </div>
                      
                      <div className={`flex-1 p-4 rounded-2xl border ${color} group`}>
                        <div className="flex justify-between items-start mb-1">
                          {editingCoughId === (c._id || c.id) ? (
                            <input 
                              type="text" 
                              value={editCoughForm.result} 
                              onChange={e => setEditCoughForm({...editCoughForm, result: e.target.value})} 
                              className="text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 w-full mr-2 outline-none"
                              placeholder="Result"
                            />
                          ) : (
                            <h4 className="font-bold text-sm">{translatedResult.toUpperCase()}</h4>
                          )}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs opacity-70 font-medium">{date}</span>
                            {editingCoughId === (c._id || c.id) ? (
                              <button onClick={() => handleSaveCough(c._id || c.id)} className="text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 p-1 rounded transition-colors"><span className="material-symbols-outlined text-[14px]">save</span></button>
                            ) : (
                              <button onClick={() => handleEditCoughStart(c)} className="opacity-0 group-hover:opacity-100 text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 p-1 rounded transition-opacity"><span className="material-symbols-outlined text-[14px]">edit</span></button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs opacity-90 font-medium">Probability: {(!isNaN(parseFloat(c.confidence)) ? (parseFloat(c.confidence) > 1 && parseFloat(c.confidence) <= 100 ? parseFloat(c.confidence) : (parseFloat(c.confidence) <= 1 ? parseFloat(c.confidence) * 100 : 100)).toFixed(1) + "%" : "-")}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center p-6 text-sm text-muted">No cough analysis history found.</div>
                )}
              </div>
            </div>

          </div>
          
        </div>
      )}
    </div>
  );
}
