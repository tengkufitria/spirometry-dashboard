import { useState } from "react"
import { API_BASE_URL } from "../api/config"

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(API_BASE_URL)
  const [saved, setSaved] = useState(false)

  // Load existing configuration from localStorage
  useState(() => {
    const savedApi = localStorage.getItem('aerovix_api_url');
    if (savedApi) setApiUrl(savedApi);
  });

  const handleSave = () => {
    localStorage.setItem('aerovix_api_url', apiUrl);
    localStorage.setItem('aerovix_prefs', JSON.stringify(prefs));
    setSaved(true)
    setTimeout(() => {
      setSaved(false);
      window.location.reload(); // Apply API URL changes
    }, 1000)
  }

  const sections = [
    {
      title: "Account",
      icon: "manage_accounts",
      color: "text-teal-500",
      bg: "bg-teal-50 dark:bg-teal-900/20",
      items: [
        { label: "Full Name", type: "text", placeholder: "e.g. Dr. Jane Doe", defaultValue: "Dr. Sarah Jenkins" },
        { label: "Email Address", type: "email", placeholder: "example@hospital.com", defaultValue: "sarah.jenkins@aerovix.med" },
        { label: "Role", type: "text", placeholder: "e.g. Pulmonologist", defaultValue: "Pulmonologist" },
      ]
    },
    {
      title: "Security",
      icon: "lock",
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      items: [
        { label: "Current Password", type: "password", placeholder: "••••••••" },
        { label: "New Password", type: "password", placeholder: "Min. 8 characters" },
        { label: "Confirm Password", type: "password", placeholder: "Repeat new password" },
      ]
    },
  ]

  const preferences = [
    { label: "Real-time sensor alerts", desc: "Receive live critical alerts on the dashboard", enabled: true },
    { label: "Email notifications", desc: "Send alerts to registered email address", enabled: false },
    { label: "Auto-refresh interval (3s)", desc: "Automatically refresh dashboard data", enabled: true },
    { label: "Dark mode by default", desc: "Launch in dark mode on next login", enabled: false },
  ]

  const [prefs, setPrefs] = useState(() => {
    const savedPrefs = localStorage.getItem('aerovix_prefs');
    return savedPrefs ? JSON.parse(savedPrefs) : preferences;
  })

  const togglePref = (i) => {
    setPrefs(prev => prev.map((p, idx) => idx === i ? { ...p, enabled: !p.enabled } : p))
  }

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage account, preferences, and API configuration</p>
      </div>

      {/* Account & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, si) => (
          <div key={si} className="bg-white dark:bg-surface-container-dark rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-2xl ${section.bg} ${section.color} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-xl">{section.icon}</span>
              </div>
              <h2 className="font-extrabold text-lg">{section.title}</h2>
            </div>
            <div className="flex flex-col gap-4">
              {section.items.map((item, ii) => (
                <div key={ii}>
                  <label className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1 block">{item.label}</label>
                  <input
                    type={item.type}
                    placeholder={item.placeholder}
                    defaultValue={item.defaultValue || ""}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preferences Toggles */}
      <div className="bg-white dark:bg-surface-container-dark rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">tune</span>
          </div>
          <h2 className="font-extrabold text-lg">Preferences</h2>
        </div>
        <div className="flex flex-col gap-4">
          {prefs.map((pref, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-bold text-sm">{pref.label}</p>
                <p className="text-xs text-muted font-medium mt-0.5">{pref.desc}</p>
              </div>
              <button
                onClick={() => togglePref(i)}
                className={`w-12 h-6 rounded-full transition-all relative ${pref.enabled ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pref.enabled ? "left-6" : "left-0.5"}`}></span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Backend API Config */}
      <div className="bg-white dark:bg-surface-container-dark rounded-3xl shadow-sm border border-gray-100 dark:border-border-dark p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">api</span>
          </div>
          <div>
            <h2 className="font-extrabold text-lg">Backend API</h2>
            <p className="text-xs text-muted font-medium">Configure the API endpoints for live data</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1 block">Base API URL</label>
            <input
              type="url"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono font-semibold outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
            <span className="material-symbols-outlined text-amber-500 text-sm">info</span>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              This will apply immediately. Ensure your backend is running before saving. Currently using: <span className="font-mono">{API_BASE_URL}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all ${saved ? "bg-green-500 text-white shadow-green-200" : "bg-primary text-white shadow-primary/20 hover:bg-primary/90"}`}
        >
          <span className="material-symbols-outlined text-sm">{saved ? "check_circle" : "save"}</span>
          {saved ? "Changes Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
