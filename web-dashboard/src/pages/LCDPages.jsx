import LcdApp from "../lcd/LCDApp"
import { useNavigate } from "react-router-dom"

export default function LcdPage() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden m-0 p-0">
      <LcdApp />
    </div>
  )
}