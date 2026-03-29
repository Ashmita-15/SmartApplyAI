import React from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, ArrowRight, Clock, Zap } from 'lucide-react'

export function SkillGapPanel({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-6 text-purple-600">
        <Lightbulb size={20} className="fill-purple-600/20" />
        <h3 className="text-lg font-bold text-gray-900">Upskilling Roadmap</h3>
      </div>

      <div className="space-y-4">
        {suggestions.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + (idx * 0.1) }}
            className={`p-4 rounded-2xl border-2 transition-all group ${
              item.impact === 'High' ? 'border-rose-100 bg-rose-50/30' : 'border-gray-100 bg-gray-50/30 hover:bg-white hover:border-purple-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                item.impact === 'High' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-gray-200 text-gray-600 border-gray-300'
              }`}>
                {item.impact} Impact
              </span>
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold">
                <Clock size={12} /> {item.timeframe}
              </div>
            </div>

            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5 capitalize">
              <Zap size={14} className="text-amber-500" />
              Focus: {item.gap}
            </h4>

            <p className="text-[12.5px] text-gray-600 font-medium leading-relaxed mb-4">
              {item.action}
            </p>

            <button className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors group">
              Find Resources <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
