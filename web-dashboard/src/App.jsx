import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import ProtectedRoute from "./routes/ProtectedRoute"
import { AuthProvider } from "./auth/AuthContext"
import LcdPage from "./pages/LCDPages"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/lcd" 
            element={<LcdPage />} 
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}