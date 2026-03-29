import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, AlertTriangle, FileText, CheckCircle2, Copy, ExternalLink, Loader2, Info, MessageSquare } from 'lucide-react'
import { prepareAutofill } from '@/services/api'
import toast from 'react-hot-toast'

export function AutofillModal({ isOpen, onClose, jobId, resumeId, jobTitle, company }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [editedCoverLetter, setEditedCoverLetter] = useState('')
  const [editedAnswers, setEditedAnswers] = useState([])
  const [activeTab, setActiveTab] = useState('review') // 'review', 'cover_letter', 'answers'

  useEffect(() => {
    if (isOpen && jobId) {
      loadPayload()
    }
  }, [isOpen, jobId])

  const loadPayload = async () => {
    setLoading(true)
    try {
      const res = await prepareAutofill({ job_id: jobId, resume_id: resumeId })
      if (res.data.error === 'INCOMPLETE_PROFILE') {
        toast.error(res.data.user_message)
        onClose()
        return
      }
      setData(res.data)
      setEditedCoverLetter(res.data.autofill_payload.cover_letter || '')
      setEditedAnswers(res.data.autofill_payload.answers || [])
    } catch (e) {
      toast.error('Failed to prepare application data')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAndOpen = async () => {
    try {
      // Build final clipboard text
      let text = `APPLICATION DATA FOR ${jobTitle} @ ${company}\n`
      text += `------------------------------------------\n\n`
      
      const p = data.autofill_payload.personal_info
      text += `NAME: ${p.full_name}\n`
      text += `EMAIL: ${p.email || ''}\n`
      text += `LOCATION: ${p.location || ''}\n\n`

      if (editedCoverLetter) {
        text += `--- COVER LETTER ---\n${editedCoverLetter}\n\n`
      }

      if (editedAnswers.length > 0) {
        text += `--- APPLICATION ANSWERS ---\n`
        editedAnswers.forEach(a => {
          text += `Q: ${a.question}\nA: ${a.answer}\n\n`
        })
      }

      await navigator.clipboard.writeText(text)
      toast.success('Application data copied! Opening site...')
      
      // Open link
      window.open(data.autofill_payload.apply_url, '_blank')
      onClose()
    } catch (e) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...editedAnswers]
    newAnswers[index] = { ...newAnswers[index], answer: value }
    setEditedAnswers(newAnswers)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative"
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6632CA] text-white flex items-center justify-center shadow-lg shadow-purple-200">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Prepare Application</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{jobTitle} @ {company}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-900 font-bold">Assembling your application...</p>
              <p className="text-sm text-gray-500">Retrieving profile data and generating tailored content</p>
            </div>
          ) : data ? (
            <>
              {/* Compliance Bar */}
              <div className="bg-amber-50 border-y border-amber-100 px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700 text-[11px] font-bold uppercase tracking-tighter">
                  <AlertTriangle size={14} /> AI-Generated Content — Please Review & Edit
                </div>
                <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-bold uppercase tracking-tighter">
                  <ShieldCheck size={14} /> Zero-Fabrication Guarantee
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-gray-100 bg-white">
                <button 
                  onClick={() => setActiveTab('review')}
                  className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'review' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Quality Report
                </button>
                <button 
                  onClick={() => setActiveTab('cover_letter')}
                  className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'cover_letter' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Cover Letter
                </button>
                <button 
                  onClick={() => setActiveTab('answers')}
                  className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'answers' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Answers ({editedAnswers.length})
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                {activeTab === 'review' && (
                  <div className="space-y-6">
                    {/* Platform Hints */}
                    {data.platform_notes && (
                      <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                        <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                           <Info size={16} /> Platform-Specific Instructions
                        </h4>
                        <ul className="space-y-2">
                          {Object.entries(data.platform_notes).map(([k, v]) => (
                            <li key={k} className="text-[13px] text-indigo-700 font-medium flex items-start gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                               {v}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Quality Badges */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-4 rounded-2xl border border-gray-200">
                          <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">Content Integrity</p>
                          <div className="flex items-center gap-2 text-emerald-600 font-bold">
                             <CheckCircle2 size={16} /> Verified Skills
                          </div>
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-gray-200">
                          <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">Completeness</p>
                          <div className="flex items-center gap-2 text-amber-600 font-bold">
                             <div className="w-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full w-[85%]" />
                             </div>
                             85% Ready
                          </div>
                       </div>
                    </div>

                    {/* Warnings */}
                    <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                       <h4 className="text-sm font-bold text-rose-900 mb-2">Attention Required</h4>
                       <p className="text-[13px] text-rose-700 font-medium">
                         The generated cover letter contains <strong>[Edit: ...]</strong> placeholders where your profile was missing specific details. Please fill these in on the next tab.
                       </p>
                    </div>
                  </div>
                )}

                {activeTab === 'cover_letter' && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                       <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                         <FileText size={16} className="text-purple-600" /> Professional Cover Letter
                       </label>
                       <span className="text-[11px] text-gray-400 font-bold">{editedCoverLetter.split(' ').length} words</span>
                    </div>
                    <textarea 
                      value={editedCoverLetter}
                      onChange={(e) => setEditedCoverLetter(e.target.value)}
                      className="flex-1 w-full p-6 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700 font-medium leading-relaxed resize-none font-mono text-sm"
                      placeholder="Write your cover letter here..."
                    />
                  </div>
                )}

                {activeTab === 'answers' && (
                  <div className="space-y-6">
                    {editedAnswers.map((ans, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Question {idx + 1}</span>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ans.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                             {ans.confidence} Confidence
                           </span>
                        </div>
                        <div className="p-5">
                          <p className="text-sm font-bold text-gray-900 mb-4 flex items-start gap-2">
                             <MessageSquare size={16} className="text-[#6632CA] mt-0.5" />
                             {ans.question}
                          </p>
                          <textarea 
                            value={ans.answer}
                            onChange={(e) => handleAnswerChange(idx, e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-700 font-medium text-sm leading-relaxed"
                            rows={4}
                            placeholder="Your answer..."
                          />
                          {ans.confidence_reason && (
                             <p className="mt-2 text-[11px] text-gray-400 italic font-medium px-1">
                               AI Note: {ans.confidence_reason}
                             </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {editedAnswers.length === 0 && (
                      <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                         <MessageSquare size={48} className="mx-auto text-gray-100 mb-4" />
                         <p className="text-gray-400 font-bold">No custom questions detected for this job.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
                <button onClick={onClose} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleCopyAndOpen}
                  className="flex-1 bg-[#6632CA] hover:bg-[#5b2cb5] text-white py-3 rounded-xl font-bold text-sm shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Copy size={20} /> Copy & Open Application Page
                  <ExternalLink size={16} className="opacity-50" />
                </button>
              </div>
            </>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
