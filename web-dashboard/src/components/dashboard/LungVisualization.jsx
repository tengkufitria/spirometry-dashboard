import lungImg from "../../assets/hologram_lung_notext.png"

export default function LungVisualization({ spo2 }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <img 
        src={lungImg} 
        alt="Lung Illustration" 
        className="w-full h-full object-cover scale-[1.35] drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)] opacity-100 animate-[pulse_4s_ease-in-out_infinite] mix-blend-multiply dark:mix-blend-screen contrast-[1.2] saturate-150" 
      />
    </div>
  )
}
