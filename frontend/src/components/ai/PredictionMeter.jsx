import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

export function PredictionMeter({ prediction }) {
  if (!prediction) return null

  const { probability = 0, confidence = 'Unknown', message = '', features = {} } = prediction

  // Map probability to width
  const progressWidth = `${probability}%`
  
  // Style based on confidence
  let color = 'from-emerald-400 to-emerald-600'
  let labelColor = 'text-emerald-700'
  let bgColor = 'bg-emerald-50'

  if (probability < 30) {
    color = 'from-rose-400 to-rose-600'
    labelColor = 'text-rose-700'
    bgColor = 'bg-rose-50'
  } else if (probability < 60) {
    color = 'from-amber-400 to-amber-500'
    labelColor = 'text-amber-700'
    bgColor = 'bg-amber-50'
  }

  return (
    <div className={`rounded-xl border border-gray-200 p-6 shadow-sm bg-white overflow-hidden relative`}>
      <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <TrendingUp size={16} /> Selection Probability
      </h3>
      
      <div className="flex items-end gap-3 mb-4">
        <span className="text-4xl font-black text-gray-900 tracking-tighter">
          {probability.toFixed(1)}<span className="text-xl text-gray-400">%</span>
        </span>
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold mb-1.5 ${bgColor} ${labelColor}`}>
          {confidence} Confidence
        </span>
      </div>

      {/* Meter Bar */}
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
        <motion.div 
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: progressWidth }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        />
      </div>

      <p className="text-sm font-medium text-gray-700 mb-5 leading-relaxed">
        {message}
      </p>

      {/* ML Feature Breakdown */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Resume Match</p>
          <p className="text-sm font-bold text-gray-800">{features.match_score}%</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Skill Overlap</p>
          <p className="text-sm font-bold text-gray-800">{features.skill_overlap_ratio}%</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Key Markers</p>
          <p className="text-sm font-bold text-gray-800">{features.keyword_matches}/10</p>
        </div>
      </div>
    </div>
  )
}
