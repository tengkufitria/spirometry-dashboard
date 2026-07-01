import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // load user from localStorage saat app start
  useEffect(() => {
    const stored = localStorage.getItem("auth")
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = (data) => {
    localStorage.setItem("auth", JSON.stringify(data))
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem("auth")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)