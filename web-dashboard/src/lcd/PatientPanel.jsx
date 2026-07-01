import { useState } from "react"

export default function PatientPanel({ onStart, systemState }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "M",
    height: "",
    weight: ""
  })

  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm({ ...form, [k]: v })

  const handleStart = async () => {
    if (!form.name || !form.age) {
      setForm({ ...form, error: "NAME & AGE REQUIRED" })
      return
    }

    // 🔥 ambil token dari localStorage
    let token = localStorage.getItem("token")

    // 🔴 Bypass login khusus untuk perangkat LCD/Raspberry Pi
    if (!token) {
      token = "AEROVIX-LCD-DEVICE-BYPASS-TOKEN-2026";
    }

    try {
      setLoading(true)

      const res = await fetch(`http://${window.location.hostname}:5000/api/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          age: Number(form.age),
          gender: form.gender,
          height: form.height ? Number(String(form.height).replace(',', '.')) : null,
          weight: form.weight ? Number(String(form.weight).replace(',', '.')) : null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed create patient")
      }

      onStart(data.data)

      setForm({
        name: "",
        age: "",
        gender: "M",
        height: "",
        weight: ""
      })

    } catch (err) {
      // alert(err.message) -> Diganti jadi pesan error di UI
      setForm({ ...form, error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const isLocked =
    systemState === "pressure" ||
    systemState === "cough"

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 text-gray-900 p-2 font-mono relative overflow-hidden">
      {/* Glassmorphism Header */}
      <div className="flex justify-between items-center mb-3 z-10 bg-white p-2 px-3 rounded-lg border border-gray-200 shadow-sm backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
           <span className="font-bold text-green-600 tracking-widest text-[10px] uppercase">
             Session Initialization
           </span>
        </div>

        <span className="text-[9px] tracking-widest bg-gray-100 px-2 py-0.5 rounded-full uppercase border border-gray-200 text-gray-600">
          {systemState === "idle" && "IDLE"}
          {systemState === "input" && "WAITING"}
          {systemState === "ready" && "READY"}
          {systemState === "pressure" && "RUNNING"}
          {systemState === "cough" && "COUGH"}
        </span>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1 z-10 no-scrollbar overflow-y-auto">
        <div className="col-span-2">
          <label className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1 block">Patient Name</label>
          <input
            disabled={isLocked}
            className="w-full h-8 px-3 bg-white border border-gray-300 shadow-sm rounded-md text-xs font-bold text-gray-900 outline-none focus:border-green-500 transition-colors disabled:opacity-50 backdrop-blur-sm"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1 block">Age</label>
          <input
            disabled={isLocked}
            type="number"
            className="w-full h-8 px-3 bg-white border border-gray-300 shadow-sm rounded-md text-xs font-bold text-gray-900 outline-none focus:border-green-500 transition-colors disabled:opacity-50 backdrop-blur-sm"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="Years"
          />
        </div>

        <div>
          <label className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1 block">Biological Sex</label>
          <select
            disabled={isLocked}
            className="w-full h-8 px-3 bg-white border border-gray-300 shadow-sm rounded-md text-xs font-bold text-gray-900 outline-none focus:border-green-500 transition-colors disabled:opacity-50 appearance-none backdrop-blur-sm"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
          >
            <option value="M">MALE (M)</option>
            <option value="F">FEMALE (F)</option>
          </select>
        </div>

        <div>
          <label className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1 block">Height (cm)</label>
          <input
            disabled={isLocked}
            type="number"
            className="w-full h-8 px-3 bg-white border border-gray-300 shadow-sm rounded-md text-xs font-bold text-gray-900 outline-none focus:border-green-500 transition-colors disabled:opacity-50 backdrop-blur-sm"
            value={form.height}
            onChange={(e) => update("height", e.target.value)}
            placeholder="cm"
          />
        </div>

        <div>
          <label className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1 block">Weight (kg)</label>
          <input
            disabled={isLocked}
            type="number"
            className="w-full h-8 px-3 bg-white border border-gray-300 shadow-sm rounded-md text-xs font-bold text-gray-900 outline-none focus:border-green-500 transition-colors disabled:opacity-50 backdrop-blur-sm"
            value={form.weight}
            onChange={(e) => update("weight", e.target.value)}
            placeholder="kg"
          />
        </div>
      </div>

      {form.error && (
        <div className="text-[9px] text-red-500 text-center font-bold tracking-widest mt-2 uppercase bg-red-500/10 py-1 rounded border border-red-500/20">
          ERROR: {form.error}
        </div>
      )}

      {/* Aesthetic Glowing Button */}
      <div className="pt-2 shrink-0 z-10 border-t border-gray-200 mt-auto">
        <button
          onClick={handleStart}
          disabled={isLocked || loading}
          className={`w-full h-9 font-bold tracking-widest uppercase rounded-md text-[10px] transition-all flex items-center justify-center gap-2 border shadow-sm backdrop-blur-md
            ${isLocked || loading
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-green-50 hover:bg-green-100 text-green-600 border-green-200 hover:border-green-400 hover:shadow-[0_4px_15px_rgba(34,197,94,0.2)]"}
          `}
        >
          {loading ? (
            "PROCESSING..."
          ) : (
            <><span className="material-symbols-outlined text-[14px]">play_arrow</span> INITIALIZE SESSION</>
          )}
        </button>
      </div>

    </div>
  )
}