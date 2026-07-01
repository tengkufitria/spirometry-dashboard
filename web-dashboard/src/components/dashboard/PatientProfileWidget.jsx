export default function PatientProfileWidget({ patient, hr, temp, spo2 }) {
  return (
    <div className="flex-1 bg-white dark:bg-surface-container-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark relative overflow-hidden flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 z-20">
          <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="patient" className="w-10 h-10 rounded-full border-2 border-primary/20" />
          <span className="font-bold text-sm">{patient.name || "William"}</span>
        </div>
        <span className="material-symbols-outlined text-muted text-sm border border-border dark:border-border-dark p-1.5 rounded-full">assignment_ind</span>
      </div>

      <div className="space-y-4 my-6">
        <div>
          <p className="text-xs text-muted font-medium">Heart Rate</p>
          <h4 className="text-3xl font-bold">{hr} <span className="text-sm font-medium text-muted">bpm</span></h4>
        </div>
        <div>
          <p className="text-xs text-muted font-medium">Temperature</p>
          <h4 className="text-2xl font-bold">{temp}°C</h4>
        </div>
        <div>
          <p className="text-xs text-muted font-medium">SpO2</p>
          <h4 className="text-2xl font-bold">{spo2}%</h4>
        </div>
      </div>

      <button className="absolute bottom-6 right-6 w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-full flex items-center justify-center transition shadow-md">
        <span className="material-symbols-outlined text-sm">arrow_outward</span>
      </button>
    </div>
  )
}
