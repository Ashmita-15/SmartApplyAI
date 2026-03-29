import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, HelpCircle, Info } from 'lucide-react'

export function RequirementMap({ requirements }) {
  if (!requirements || requirements.length === 0) return null

  const getTierColor = (tier) => {
    switch (tier) {
      case 'HARD': return 'bg-rose-50 text-rose-700 border-rose-100'
      case 'SOFT': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'IMPLICIT': return 'bg-blue-50 text-blue-700 border-blue-100'
      default: return 'bg-gray-50 text-gray-700 border-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'MATCHED': return <CheckCircle2 className="text-emerald-500" size={16} />
      case 'PARTIAL': return <AlertCircle className="text-amber-500" size={16} />
      case 'TRANSFERABLE': return <HelpCircle className="text-blue-500" size={16} />
      case 'MISSING_HARD': return <AlertCircle className="text-rose-500" size={16} />
      case 'MISSING_SOFT': return <AlertCircle className="text-gray-400" size={16} />
      default: return null
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-bold text-gray-900">Requirement Mapping</h3>
        <div className="group relative">
          <Info size={16} className="text-gray-400 cursor-help" />
          <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
            <strong>HARD:</strong> Critical ATS filters.<br/>
            <strong>SOFT:</strong> Preferred "plus" skills.<br/>
            <strong>IMPLICIT:</strong> Expected for this role type.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {requirements.map((req, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="shrink-0">{getStatusIcon(req.status)}</div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-gray-900 truncate block">{req.requirement}</span>
                {req.evidence && (
                  <span className="text-[11px] text-gray-500 font-medium italic truncate block">{req.evidence}</span>
                )}
              </div>
            </div>

            <div className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierColor(req.tier)}`}>
              {req.tier}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
