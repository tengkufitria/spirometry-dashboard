import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import AlertCard from "./AlertCard"

export default function Topbar({ alerts = [], activeTab = "Overview", setActiveTab }) {
  const [openNotif, setOpenNotif] = useState(false)
  const [openSettings, setOpenSettings] = useState(false)

  const ref = useRef()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark"
  })

  // DARK MODE
  useEffect(() => {
    const root = document.documentElement

    if (dark) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [dark])

  // CLOSE DROPDOWN OUTSIDE CLICK
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenNotif(false)
        setOpenSettings(false)
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const tabs = ["Dashboard", "Patients", "Analytics", "Settings"]

  return (
    <header className="sticky top-0 z-50 flex flex-col md:flex-row justify-between items-center px-4 md:px-8 py-4 md:h-20 gap-4 md:gap-0
      bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-md w-full">

      {/* LEFT: LOGO */}
      <div className="flex w-full md:w-auto justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-lg shadow-primary/30 transform group-hover:scale-105 transition-all">
            <span className="material-symbols-outlined font-bold">air</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface dark:text-on-surface-dark tracking-tight">
            Aerovix
          </h1>
        </div>
        
        {/* MOBILE ICONS (Only visible on small screens) */}
        <div className="flex md:hidden items-center gap-2 relative">
          <button
            onClick={() => setOpenNotif(!openNotif)}
            className="p-2 rounded-full bg-white dark:bg-surface-container-dark hover:bg-gray-50 dark:hover:bg-surface-container-low-dark transition shadow-sm border border-gray-100 dark:border-border-dark relative"
          >
            <span className="material-symbols-outlined text-muted text-lg leading-none">notifications</span>
            {alerts.length > 0 && (
              <span className="absolute top-0 right-0 bg-secondary text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full border border-white">
                {alerts.length}
              </span>
            )}
          </button>
          <div className="relative">
            <button onClick={() => setOpenSettings(!openSettings)} className="w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-surface-container-dark shadow-sm">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="profile" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </div>

      {/* CENTER: TABS */}
      <div className="flex items-center gap-2 bg-white dark:bg-surface-container-dark p-1.5 rounded-full shadow-sm border border-gray-100 dark:border-border-dark overflow-x-auto w-full md:w-auto max-w-full no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all
              ${activeTab === tab 
                ? "bg-surface dark:bg-surface-container-low-dark text-on-surface dark:text-on-surface-dark shadow-sm" 
                : "text-muted hover:text-on-surface dark:hover:text-on-surface-dark"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* RIGHT: ICONS & PROFILE (Visible on desktop only) */}
      <div className="hidden md:flex items-center gap-4 relative" ref={ref}>

        <button
          onClick={() => navigate("/lcd")}
          title="Open LCD Mode (Hardware Screen)"
          className="p-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition shadow-sm border border-primary/20"
        >
          <span className="material-symbols-outlined text-xl leading-none">
            important_devices
          </span>
        </button>

        <button className="p-2.5 rounded-full bg-white dark:bg-surface-container-dark hover:bg-gray-50 dark:hover:bg-surface-container-low-dark transition shadow-sm border border-gray-100 dark:border-border-dark">
          <span className="material-symbols-outlined text-muted text-xl leading-none">
            search
          </span>
        </button>

        <button
          onClick={() => setOpenNotif(!openNotif)}
          className="p-2.5 rounded-full bg-white dark:bg-surface-container-dark hover:bg-gray-50 dark:hover:bg-surface-container-low-dark transition shadow-sm border border-gray-100 dark:border-border-dark relative"
        >
          <span className="material-symbols-outlined text-muted text-xl leading-none">
            notifications
          </span>
          {alerts.length > 0 && (
            <span className="absolute top-0 right-0 
              bg-secondary text-white text-[10px] 
              w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-surface-container-dark">
              {alerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setDark(!dark)}
          className="p-2.5 rounded-full bg-white dark:bg-surface-container-dark hover:bg-gray-50 dark:hover:bg-surface-container-low-dark transition shadow-sm border border-gray-100 dark:border-border-dark"
        >
          <span className="material-symbols-outlined text-muted text-xl leading-none">
            {dark ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* SETTINGS + LOGOUT DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setOpenSettings(!openSettings)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-surface-container-dark shadow-sm"
          >
            <img
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              alt="profile"
              className="w-full h-full object-cover"
            />
          </button>

          {openSettings && (
            <div className="absolute right-0 top-14 w-48 
              bg-white dark:bg-surface-container-dark border border-gray-100 dark:border-border-dark rounded-2xl shadow-xl p-2 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-xl 
                text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* NOTIF DROPDOWN */}
        {openNotif && (
          <div className="absolute right-0 top-14 w-80 
            bg-white dark:bg-surface-container-dark border border-gray-100 dark:border-border-dark rounded-2xl shadow-xl p-4 space-y-3 z-50">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-on-surface dark:text-on-surface-dark">
                Notifications
              </h3>
              <span className="text-xs font-semibold text-primary dark:text-primary-container bg-primary/10 px-2 py-1 rounded-md">
                {alerts.length} new
              </span>
            </div>
            {alerts.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">
                No notifications
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {alerts.slice(0, 5).map((a) => (
                  <AlertCard
                    key={a.id}
                    time={a.time}
                    title={a.title || a.name}
                    desc={a.desc || a.message}
                    severity={a.severity || "critical"}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  )
}
