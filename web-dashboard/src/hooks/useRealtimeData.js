import { useState, useEffect } from "react"
import { ENDPOINTS } from "../api/config"

export default function useRealtimeData() {
  const [patients, setPatients] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [spiroRes, coughRes] = await Promise.all([
          fetch(ENDPOINTS.spirometry, { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }),
          fetch(ENDPOINTS.cough, { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } })
        ]);
        
        if (!spiroRes.ok) return;
        
        const spiroJson = await spiroRes.json();
        const coughJson = coughRes.ok ? await coughRes.json() : { data: [] };
        
        const spiroData = spiroJson.data || [];
        const coughData = coughJson.data || [];
        
        const mapped = spiroData.map(item => {
          const p = item.patientId || {};
          const pid = p._id || p;

          // Temukan semua data batuk untuk pasien ini
          const patientCoughs = coughData.filter(c => (c.patientId?._id || c.patientId) === pid);
          
          let cData = null;
          if (patientCoughs.length > 0) {
            const spiroTime = new Date(item.recordedAt || item.createdAt || Date.now()).getTime();
            
            // Cari data batuk yang waktunya paling berdekatan dengan tes spiro ini
            patientCoughs.sort((a, b) => {
               const timeA = new Date(a.recordedAt || a.createdAt || Date.now()).getTime();
               const timeB = new Date(b.recordedAt || b.createdAt || Date.now()).getTime();
               return Math.abs(timeA - spiroTime) - Math.abs(timeB - spiroTime);
            });
            
            // Hanya cocokkan jika jarak waktunya kurang dari 2 jam (7200000 ms) agar tidak salah pasang
            // ke tes hari lain jika dia tidak batuk di tes ini.
            const closestTime = new Date(patientCoughs[0].recordedAt || patientCoughs[0].createdAt).getTime();
            if (Math.abs(closestTime - spiroTime) < 7200000) {
              cData = patientCoughs[0];
            }
          }

          let statusLabel = item.diagnosis || "Unknown";

          return {
            id: item._id,
            patientId: pid,
            name: p.name || item.name || "Unknown Patient",
            age: p.age || "-",
            gender: p.gender || "-",
            height: p.height || "-",
            weight: p.weight || "-",
            catScore: (item.catScore !== undefined && item.catScore !== null) ? item.catScore : (p.catScore !== undefined && p.catScore !== null ? p.catScore : "-"),
            fev1: item.fev1 ? Number(item.fev1.toFixed(2)) : 0,
            fvc: item.fvc ? Number(item.fvc.toFixed(2)) : 0,
            fev1Pred: item.fev1Pred ? Number(item.fev1Pred.toFixed(2)) : "-",
            fvcPred: item.fvcPred ? Number(item.fvcPred.toFixed(2)) : "-",
            peakFlow: item.peakFlow ? Number(item.peakFlow.toFixed(2)) : "-",
            blowQuality: item.blowQuality || "-",
            ratio: item.ratio ? Math.round(item.ratio * 100) : 0,
            matrix: cData?.confidence ? Number(cData.confidence).toFixed(2) : "-",
            status: statusLabel,
            rawDiagnosis: item.diagnosis || "-",
            coughStatus: cData?.result || "Unknown",
            spiroWaveform: item.waveform || [],
            coughWaveform: cData?.waveform || [],
            rawTime: item.recordedAt || new Date().toISOString(),
            time: item.recordedAt ? new Date(item.recordedAt).toLocaleString() : new Date().toLocaleString()
          }
        });
        
        setPatients(mapped);

        // Auto-generate active alerts based on recent critical data
        const newAlerts = [];
        mapped.slice(0, 10).forEach(p => {
          if (p.status?.toUpperCase().includes("SEVERE")) {
            newAlerts.push({
              id: `spiro-${p.id}`,
              title: `Critical: Severe Obstruction - ${p.name}`,
              time: p.time
            });
          }
          if (p.coughStatus?.toUpperCase() === "PPOK" || p.coughStatus?.toUpperCase() === "COPD") {
            newAlerts.push({
              id: `cough-${p.id}`,
              title: `Alert: COPD Detected - ${p.name}`,
              time: p.time
            });
          }
          if (p.ratio < 70 && p.ratio > 0 && !p.status?.toUpperCase().includes("SEVERE")) {
            newAlerts.push({
              id: `ratio-${p.id}`,
              title: `Warning: Low Lung Ratio (${p.ratio}%) - ${p.name}`,
              time: p.time
            });
          }
        });
        
        // Remove duplicates and limit to top 5 most recent
        const uniqueAlerts = Array.from(new Map(newAlerts.map(a => [a.title, a])).values());
        setAlerts(uniqueAlerts.slice(0, 5));

      } catch (err) {
        console.warn("Failed to fetch real-time data:", err.message);
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)

    return () => clearInterval(interval)
  }, [])

  return { patients, alerts }
}