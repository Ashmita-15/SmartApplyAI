import { motion } from 'framer-motion'
import { Target } from 'lucide-react'

export function MatchScoreCard({ score = 0 }) {
  // Determine colors based on score
  let colorClass = 'text-emerald-500'
  let bgClass = 'bg-emerald-50'
  let label = 'Excellent Fit'
  
  if (score < 50) {
    colorClass = 'text-rose-500'
    bgClass = 'bg-rose-50'
    label = 'Low Fit'
  } else if (score < 75) {
    colorClass = 'text-amber-500'
    bgClass = 'bg-amber-50'
    label = 'Good Fit'
  }

  // Circle math (circumference = 2 * pi * r)
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center text-center">
      <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-6 w-full text-left flex items-center gap-2">
        <Target size={16} /> AI Match Score
      </h3>
      
      <div className="relative w-32 h-32 mb-4">
        {/* Background Circle */}
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r={radius} 
            fill="none" strokeWidth="8" 
            className="stroke-gray-100" 
          />
          {/* Progress Circle */}
          <motion.circle 
            cx="50" cy="50" r={radius} 
            fill="none" strokeWidth="8" 
            className={colorClass}
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black tracking-tighter ${colorClass}`}>
            {Math.round(score)}<span className="text-xl">%</span>
          </span>
        </div>
      </div>
      
      <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${bgClass} ${colorClass}`}>
        {label}
      </div>
      <p className="text-xs text-gray-500 mt-3 font-medium px-4">
        Based on semantic similarity and keyword overlap
      </p>
    </div>
  )
}
