import xrayImg from "../../assets/xray.png"

export default function ImagingCard() {
  return (
    <div className="flex-1 rounded-3xl overflow-hidden relative shadow-lg group">
      <img src={xrayImg} alt="X-ray" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"></div>

      {/* Top buttons */}
      <div className="absolute top-4 left-4 flex gap-2">
        <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/30 transition">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
        <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/30 transition">
          <span className="material-symbols-outlined text-sm">water_drop</span>
        </button>
      </div>

      <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/30 transition">
        <span className="material-symbols-outlined text-sm">description</span>
      </button>

      {/* Bottom text */}
      <div className="absolute bottom-6 left-6 right-6">
        <p className="text-[10px] text-gray-300 font-medium mb-1">Pulmonary imaging</p>
        <h3 className="text-2xl font-extrabold text-white tracking-wide">Severe COPD</h3>
      </div>

      <button className="absolute bottom-6 right-6 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-100 transition shadow-md z-10">
        <span className="material-symbols-outlined text-sm">arrow_outward</span>
      </button>
    </div>
  )
}
