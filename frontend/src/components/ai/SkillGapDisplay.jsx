import { motion } from 'framer-motion'
import { CheckCircle, XCircle, BookOpen } from 'lucide-react'

export function SkillGapDisplay({ missingSkills = [], matchingSkills = [], recommendations = [] }) {
  const totalSkills = missingSkills.length + matchingSkills.length
  
  if (totalSkills === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BookOpen className="text-purple-600" size={20} />
        Skill Gap Analysis
      </h3>

      {/* Matching Skills */}
      <div className="mb-6">
        <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <CheckCircle size={14} className="text-emerald-500" />
          Skills You Have ({matchingSkills.length}/{totalSkills})
        </h4>
        <div className="flex flex-wrap gap-2">
          {matchingSkills.length > 0 ? (
            matchingSkills.map(skill => (
              <span key={skill} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm font-semibold tracking-wide">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400 font-medium">No matching skills found</span>
          )}
        </div>
      </div>

      {/* Missing Skills */}
      <div className="mb-6">
        <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <XCircle size={14} className="text-rose-500" />
          Skills You're Missing ({missingSkills.length}/{totalSkills})
        </h4>
        <div className="flex flex-wrap gap-2">
          {missingSkills.length > 0 ? (
            missingSkills.map(skill => (
              <span key={skill} className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-sm font-semibold tracking-wide hover:bg-rose-100 transition-colors cursor-default">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400 font-medium">You have all the required skills!</span>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations?.length > 0 && (
        <div className="pt-5 border-t border-gray-100">
          <h4 className="text-sm font-bold text-gray-900 mb-3">Learning Resources</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => {
              // Parse the bolding from the backend "**Skill**: Resource"
              const match = rec.match(/\*\*(.*?)\*\*:\s*(.*)/)
              if (match) {
                return (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></span>
                    <span className="text-gray-600">
                      <strong className="text-gray-900">{match[1]}</strong>: {match[2]}
                    </span>
                  </li>
                )
              }
              return <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></span>
                {rec}
              </li>
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
