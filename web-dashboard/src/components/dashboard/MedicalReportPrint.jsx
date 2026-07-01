import React from "react";
const val = (v, suffix = "") => (v !== undefined && v !== null && v !== "") ? `${v}${suffix}` : "—";
const translateStatus = (status) => {
  if (!status) return "-";
  if (status.toUpperCase() === "PPOK" || status.toUpperCase() === "COPD") return "COPD";
  if (status.toUpperCase() === "NON-COPD" || status === "Sehat" || status === "NORMAL" || status === "Gejala Ringan") return "NON-COPD";
  return status;
};

export default function MedicalReportPrint({ exam }) {
  if (!exam) return null;

  const dateStr = exam.time || new Date().toLocaleString();
  const ratio = exam.ratio ? val(exam.ratio) : 0;
  
  const ratioFev1Fvc = exam.ratio ? (exam.ratio / 100) : 0;
  const coughResultStr = exam.coughStatus?.toUpperCase() || "";
  const coughAbnormal = coughResultStr === "PPOK" || coughResultStr === "COPD" || coughResultStr === "ABNORMAL";
  
  let spiroStatus = "NORMAL";
  let spiroScore = 0;
  if (ratioFev1Fvc > 0 && ratioFev1Fvc < 0.70) {
    spiroStatus = "OBSTRUCTIVE SUSPECT";
    spiroScore = 1;
  }
  
  const rawCat = exam.catScore && exam.catScore !== "-" ? Number(exam.catScore) : 0;
  const catNorm = Math.min(rawCat / 40.0, 1.0);
  
  let rawCoughVal = exam.matrix;
  if (exam.confidence !== undefined && exam.confidence !== null) rawCoughVal = exam.confidence;
  else if (exam.score !== undefined && exam.score !== null) rawCoughVal = exam.score;

  let annScore = rawCoughVal && rawCoughVal !== "-" ? Number(rawCoughVal) : 0;
  if (annScore > 1 && annScore <= 100) annScore = annScore / 100;
  else if (annScore > 100) annScore = 1;
  
  const SPIRO_WEIGHT = 0.648;
  const ANN_WEIGHT = 0.230;
  const CAT_WEIGHT = 0.122;
  const riskScore = (SPIRO_WEIGHT * spiroScore) + (ANN_WEIGHT * annScore) + (CAT_WEIGHT * catNorm);
  
  let finalDiag = "";
  let riskLevel = "LOW";
  
  if (riskScore < 0.40) {
    riskLevel = "LOW";
  } else if (riskScore >= 0.40 && riskScore < 0.70) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "HIGH";
  }
  
  if (riskLevel === "LOW") {
    finalDiag = "LOW RISK";
  } else if (riskLevel === "MEDIUM") {
    finalDiag = "MODERATE RISK";
  } else {
    finalDiag = "HIGH RISK";
  }
  
  // Ref values
  const fev1Ref = exam.fev1Pred ? `>= ${val(exam.fev1Pred)}` : "—";
  const fvcRef = exam.fvcPred ? `>= ${val(exam.fvcPred)}` : "—";

  return (
    <div className="hidden print:block bg-white text-black font-sans w-full max-w-[210mm] mx-auto text-sm">
      
      {/* HEADER */}
      <div className="flex items-start justify-between pb-2 border-b-4 border-primary mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center border-4 border-primary-container">
            <span className="material-symbols-outlined text-3xl">air</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight m-0 leading-tight">AEROVIX CLINIC LAB</h1>
            <p className="text-xs font-bold text-secondary m-0">Accurate | Intelligent | Instant</p>
            <p className="text-[10px] text-gray-500 m-0 mt-0.5">Jl. Kesehatan No. 1, Jakarta, Indonesia - 12345</p>
          </div>
        </div>
        <div className="text-right text-[10px]">
          <p className="flex justify-end items-center gap-1.5 mb-0.5">
            <span className="material-symbols-outlined text-[14px] text-primary">call</span>
            <span className="font-bold">0123456789 | 0912345678</span>
          </p>
          <p className="flex justify-end items-center gap-1.5 mb-0.5">
            <span className="material-symbols-outlined text-[14px] text-secondary">mail</span>
            <span className="font-bold">lab@aerovix.com</span>
          </p>
          <p className="bg-primary text-white px-2 py-0.5 mt-1 inline-block font-bold">www.aerovix.com</p>
        </div>
      </div>

      {/* PATIENT DETAILS */}
      <div className="grid grid-cols-3 gap-2 mb-3 border-b border-gray-300 pb-3">
        <div>
          <h2 className="text-base font-black mb-1">{val(exam.name)}</h2>
          <table className="text-[10px]">
            <tbody>
              <tr><td className="py-0 pr-3 text-gray-600">Age</td><td className="font-bold">: {val(exam.age)} Years</td></tr>
              <tr><td className="py-0 pr-3 text-gray-600">Sex</td><td className="font-bold">: {exam.gender === "M" ? "Male" : exam.gender === "F" ? "Female" : val(exam.gender)}</td></tr>
              <tr><td className="py-0 pr-3 text-gray-600">BMI / CAT</td><td className="font-bold">: {exam.height && exam.weight ? (exam.weight / ((exam.height / 100) ** 2)).toFixed(1) : "—"} / {val(exam.catScore)}</td></tr>
              <tr><td className="py-0 pr-3 text-gray-600">PID</td><td className="font-bold">: {exam.patientId?.substring(0, 8) || "—"}</td></tr>
            </tbody>
          </table>
        </div>
        
        <div className="border-l border-r border-gray-300 px-3">
          <p className="font-bold text-[11px] mb-0.5">Sample Collected At:</p>
          <p className="text-[10px] text-gray-600 mb-2">Aerovix Central Facility</p>
          <p className="text-[10px]"><span className="text-gray-600">Ref. By:</span> <span className="font-bold">Dr. AI System</span></p>
        </div>

        <div className="pl-3 text-[10px]">
          <div className="mb-1">
            <svg width="120" height="25" xmlns="http://www.w3.org/2000/svg">
               <rect width="100%" height="100%" fill="white"/>
               {[...Array(20)].map((_, i) => (
                 <rect key={i} x={i * 6} y="0" width={Math.random() > 0.5 ? 2 : 4} height="25" fill="black" />
               ))}
            </svg>
          </div>
          <table className="text-[10px] w-full">
            <tbody>
              <tr><td className="py-0 font-bold">Registered on:</td><td className="text-right">{dateStr}</td></tr>
              <tr><td className="py-0 font-bold">Collected on:</td><td className="text-right">{dateStr}</td></tr>
              <tr><td className="py-0 font-bold">Reported on:</td><td className="text-right">{new Date().toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="text-center text-lg font-black text-secondary mb-2 pb-1 border-b-2 border-gray-200">Complete Respiratory Examination</h3>

      {/* RESULT TABLE */}
      <table className="w-full text-[11px] mb-3">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left">
            <th className="py-1 font-bold w-2/5 text-primary">Investigation</th>
            <th className="py-1 font-bold w-1/5 text-primary">Result</th>
            <th className="py-1 font-bold w-1/5 text-primary">Reference Value</th>
            <th className="py-1 font-bold w-1/5 text-primary">Unit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr className="bg-primary/5"><td colSpan="4" className="py-1 px-1 font-black text-[10px] text-primary uppercase tracking-wider">Spirometry Test</td></tr>
          <tr>
            <td className="py-1 px-1">Forced Expiratory Volume (FEV1)</td>
            <td className="py-1 font-bold text-primary">{val(exam.fev1)}</td>
            <td className="py-1">{fev1Ref}</td>
            <td className="py-1">L</td>
          </tr>
          <tr>
            <td className="py-1 px-1">Forced Vital Capacity (FVC)</td>
            <td className="py-1 font-bold text-primary">{val(exam.fvc)}</td>
            <td className="py-1">{fvcRef}</td>
            <td className="py-1">L</td>
          </tr>
          <tr>
            <td className="py-1 px-1">FEV1/FVC Ratio</td>
            <td className={`py-1 font-bold ${ratio < 70 ? "text-secondary" : "text-primary"}`}>{ratio}</td>
            <td className="py-1 font-bold text-secondary">{`< 70 (COPD Risk)`}</td>
            <td className="py-1">%</td>
          </tr>
          <tr>
            <td className="py-1 px-1">Peak Expiratory Flow (PEF)</td>
            <td className="py-1 font-bold">{val(exam.peakFlow)}</td>
            <td className="py-1">—</td>
            <td className="py-1">L/s</td>
          </tr>
          <tr>
            <td className="py-1 px-1">Test Validity</td>
            <td className={`py-1 font-bold ${exam.blowQuality === 'Valid' ? 'text-primary' : 'text-amber-500'}`}>{val(exam.blowQuality)}</td>
            <td className="py-1">Valid</td>
            <td className="py-1">—</td>
          </tr>

          <tr className="bg-primary/5"><td colSpan="4" className="py-1 px-1 mt-2 font-black text-[10px] text-primary uppercase tracking-wider">Acoustic Cough Analysis</td></tr>
          <tr>
            <td className="py-1 px-1">AI Probability / Score</td>
            <td className="py-1 font-bold">{val(rawCoughVal)}</td>
            <td className="py-1">—</td>
            <td className="py-1">pts</td>
          </tr>
          <tr>
            <td className="py-1 px-1">Cough Status Result</td>
            <td className={`py-1 font-bold ${coughAbnormal ? 'text-secondary' : 'text-primary'}`}>{translateStatus(val(exam.coughStatus))}</td>
            <td className="py-1">NON-COPD</td>
            <td className="py-1">—</td>
          </tr>

          <tr className="bg-primary/5"><td colSpan="4" className="py-1 px-1 mt-2 font-black text-[10px] text-primary uppercase tracking-wider">Clinical Screening</td></tr>
          <tr>
            <td className="py-1 px-1">Spirometry Impression</td>
            <td className="py-1 font-bold" colSpan="3">{exam.rawDiagnosis || val(exam.status)}</td>
          </tr>
          <tr>
            <td className="py-1 px-1 font-black text-secondary">Final Screening</td>
            <td className={`py-1 font-black ${riskLevel === 'HIGH' ? 'text-secondary' : riskLevel === 'MEDIUM' ? 'text-amber-500' : 'text-primary'}`} colSpan="3">{finalDiag}</td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER */}
      <div className="mt-4 pt-2">
        <p className="text-[9px] mb-1 text-gray-600"><strong>Instruments:</strong> Aerovix Handheld Spirometer, AI Acoustic Microphone Sensor</p>
        <p className="text-[9px] mb-4 text-gray-600"><strong>Interpretation:</strong> Further confirm for COPD if FEV1/FVC ratio is &lt; 70% and symptoms are present.</p>
        
        <div className="flex justify-between items-end border-b-2 border-primary pb-2">
          <div className="text-center">
             <div className="font-[signature] text-xl mb-0.5 -rotate-6 text-primary">Aerovix AI</div>
             <p className="font-bold text-[10px]">Automated CDSS</p>
             <p className="text-[9px] text-gray-500">(Clinical Decision Support)</p>
          </div>
          <div className="text-center">
             <div className="w-24 h-6 border-b border-gray-400 border-dashed mb-1"></div>
             <p className="font-bold text-[10px]">Dr. __________</p>
             <p className="text-[9px] text-gray-500">(Reviewing Physician)</p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-primary text-white p-2 mt-1 rounded-sm">
           <p className="text-[9px] font-bold">Generated by Aerovix Systems</p>
           <p className="text-[9px]">Page 1 of 1</p>
        </div>
      </div>
    </div>
  );
}
