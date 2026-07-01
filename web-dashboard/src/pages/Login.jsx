import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import logoImg from "../assets/logo_aerovix-Photoroom.png"
import lungImg from "../assets/lung.png"

export default function Login() {
  const [role, setRole] = useState("doctor")
  const [medicalLicenseId, setMedicalLicenseId] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
  
    if (!medicalLicenseId || !password) {
      alert("Please fill all fields")
      return
    }
  
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          medicalLicenseId,
          password
        })
      })
  
      const data = await res.json()
  
      if (!res.ok) {
        throw new Error(data.error || "Login failed")
      }
  
      // 🔥 SIMPAN TOKEN + USER
      const userData = {
        role: data.user.role,
        license: data.user.medicalLicenseId,
        token: data.token
      }
  
      login(userData)
  
      // tambahan (biar reload ga logout)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(userData))
  
      navigate("/dashboard")
  
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-surface dark:bg-surface-dark transition-colors font-body overflow-hidden text-on-surface dark:text-on-surface-dark">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-70"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-70"></div>

      {/* Faint Lung Image in Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 dark:opacity-10 mix-blend-luminosity">
        <img src={lungImg} alt="Background Graphic" className="w-[800px] h-auto object-contain" />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Centered Glassmorphism Card */}
        <div className="bg-white/80 dark:bg-surface-container-dark/80 backdrop-blur-xl p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-white/10 transition-colors">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-56 mx-auto mb-6">
              <img src={logoImg} alt="Aerovix Logo" className="w-full h-auto object-contain drop-shadow-md scale-110" />
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-muted font-medium text-sm">
              Please enter your credentials to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* LICENSE */}
            <div>
              <label className="block text-xs font-extrabold text-muted uppercase tracking-wider mb-2 ml-1">
                Medical License ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-muted group-focus-within:text-primary transition-colors">badge</span>
                </div>
                <input
                  value={medicalLicenseId}
                  onChange={(e) => setMedicalLicenseId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/80 dark:border-gray-700/80 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface dark:text-on-surface-dark font-bold placeholder:text-muted/50 placeholder:font-medium backdrop-blur-sm"
                  placeholder={role === "doctor" ? "MD-2094-883" : "ADM-0001"}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xs font-extrabold text-muted uppercase tracking-wider mb-2 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-muted group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/80 dark:border-gray-700/80 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface dark:text-on-surface-dark font-bold placeholder:text-muted/50 placeholder:font-medium tracking-wide backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-on-surface dark:hover:text-on-surface-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {show ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-4 px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                   <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-colors" />
                   <span className="text-xs font-semibold text-muted group-hover:text-on-surface dark:group-hover:text-on-surface-dark transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                  onClick={() => alert("Forgot password flow")}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="w-full py-4 mt-6 rounded-2xl bg-primary text-white font-extrabold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 flex justify-center items-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center gap-2">
                Access Portal
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </span>
            </button>

          </form>

        </div>
        
        {/* Footer */}
        <p className="text-center text-xs font-semibold text-muted mt-8">
          © 2026 AeroVix Healthcare. All rights reserved.
        </p>

      </div>
    </div>
  )
}