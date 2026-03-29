import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Briefcase, ExternalLink, Users, DollarSign, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ApplyModal } from './ApplyModal'
import toast from 'react-hot-toast'

export function JobCard({ job, onAnalyze, selectedResumeId, matchData, onSelectResume, autoOpenApply }) {
  const [showModal, setShowModal] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (autoOpenApply) {
      handleSmartApply()
    }
  }, [autoOpenApply])

  const handleSmartApply = () => {
    // Auth guard: if not logged in, save job and redirect
    if (!user) {
      localStorage.setItem('pendingApplyJob', job.id)
      toast('Please log in to apply', { icon: '🔒' })
      navigate('/auth')
      return
    }
    if (!selectedResumeId) {
      onSelectResume && onSelectResume()
      toast('Please select a resume first', { icon: '📄' })
      return
    }
    setShowModal(false)
    setApplyOpen(true)
  }

  // Fallbacks
  const timeAgo = job.timeAgo || '2 hours ago'
  const teamSize = job.teamSize || '11-50'
  const isUS = job.location?.toLowerCase().includes('us') || job.location?.toLowerCase().includes('remote')
  const salary = job.stipend || '$100k-140k'

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex gap-4"
      >
        {/* Logo */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {(job.company || 'C').charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-base font-bold text-gray-900 truncate">{job.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              {matchData && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  matchData.score >= 70 ? 'bg-emerald-50 text-emerald-700' :
                  matchData.score >= 40 ? 'bg-amber-50 text-amber-700' :
                  'bg-rose-50 text-rose-700'
                }`}>
                  {Math.round(matchData.score)}% Match
                </span>
              )}
              <span className="text-gray-400 text-[13px] font-medium whitespace-nowrap">{timeAgo}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] font-medium text-gray-600 mb-4">
            <span className="font-bold text-gray-900">{job.company}</span>
            <span className="flex items-center gap-1.5"><Users size={14} className="text-gray-400"/> {teamSize}</span>
            <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-gray-400"/> {salary}</span>
            <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-full text-gray-700 font-bold text-xs">
              {isUS ? '🇺🇸 US only' : '🌍 Remote'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 box-border rounded-full bg-[#F3F4F6] text-[#4B5563] text-xs font-bold tracking-wide">
              Full time
            </span>
            {(job.skills || []).slice(0, 2).map(skill => (
              <span key={skill} className="px-2.5 py-1 box-border rounded-full bg-[#EEF2FC] text-[#3B82F6] text-xs font-bold tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
                {skill}
              </span>
            ))}
            {job.platform && (
              <span className="px-2.5 py-1 box-border rounded-full bg-purple-50 text-purple-600 border border-purple-100 text-xs font-bold tracking-wide capitalize">
                {job.platform}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="card p-8 max-w-xl w-full max-h-[85vh] overflow-y-auto bg-white shadow-2xl relative border border-gray-200 rounded-2xl"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {(job.company || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{job.title}</h2>
                    <p className="font-bold text-purple-600 mt-1">{job.company}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors absolute top-6 right-6">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm mb-6 text-gray-600 font-medium border-b border-gray-100 pb-6">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400" />{job.location}</span>
                <span className="flex items-center gap-1.5"><DollarSign size={16} className="text-gray-400" />{salary}</span>
                <span className="flex items-center gap-1.5"><Users size={16} className="text-gray-400" />{teamSize}</span>
                <span className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 text-indigo-700"><Briefcase size={16} />{job.platform}</span>
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {(job.skills || []).map((skill) => (
                    <span key={skill} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-[13px] font-bold tracking-wide">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => { setShowModal(false); onAnalyze && onAnalyze(job) }} className="btn-secondary text-sm flex-[1] py-3 bg-purple-50 hover:bg-purple-100 border-none text-purple-700">
                  Analyze Fit
                </button>
                <a href={job.apply_link} target="_blank" rel="noreferrer"
                  className="btn-secondary text-sm flex items-center justify-center gap-2 flex-1 no-underline border-gray-200 text-gray-700 hover:bg-gray-50 py-3">
                  <ExternalLink size={16} /> External Apply
                </a>
                <button onClick={handleSmartApply}
                  className="btn-primary text-sm flex-[2] py-3 shadow-md shadow-purple-600/20 bg-[#6632CA] hover:bg-[#5b2cb5]">
                  ✨ Smart Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Apply Modal */}
      <ApplyModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        jobId={job.id}
        resumeId={selectedResumeId}
        jobTitle={job.title}
        company={job.company}
        applyLink={job.apply_link}
        platform={job.platform}
      />
    </>
  )
}
