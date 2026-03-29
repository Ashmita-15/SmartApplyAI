import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ShieldCheck, AlertTriangle, FileText, CheckCircle2,
  Loader2, Info, MessageSquare, Send, User, Mail, Phone,
  ExternalLink, Sparkles, Edit3
} from 'lucide-react'
import { prepareAutofill, applyToJob } from '@/services/api'
import toast from 'react-hot-toast'

export function ApplyModal({ isOpen, onClose, jobId, resumeId, jobTitle, company, applyLink, platform }) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [data, setData] = useState(null)

  // Editable fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [editedCoverLetter, setEditedCoverLetter] = useState('')
  const [editedAnswers, setEditedAnswers] = useState([])
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (isOpen && jobId) {
      setSubmitted(false)
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
      const d = res.data
      setData(d)
      const p = d.autofill_payload || {}
      setFullName(p.full_name || '')
      setEmail(p.email || '')
      setPhone(p.phone || '')
      setEditedCoverLetter(p.cover_letter || '')
      setEditedAnswers(p.answers || [])
    } catch (e) {
      toast.error('Failed to prepare application data')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (submitting || submitted) return
    setSubmitting(true)
    try {
      await applyToJob({
        job_id: jobId,
        resume_id: resumeId,
        user_details: {
          full_name: fullName,
          email,
          phone,
          cover_letter: editedCoverLetter,
          answers: editedAnswers,
        }
      })
      setSubmitted(true)
      toast.success('Application submitted successfully!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswerChange = (index, value) => {
    const updated = [...editedAnswers]
    updated[index] = { ...updated[index], answer: value }
    setEditedAnswers(updated)
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'details', label: 'Your Details', icon: User },
    { id: 'cover_letter', label: 'Cover Letter', icon: FileText },
    { id: 'answers', label: `Answers (${editedAnswers.length})`, icon: MessageSquare },
  ]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.95, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6632CA] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg shadow-purple-300/30">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Smart Apply</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">{jobTitle} · {company}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center py-24">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#6632CA] animate-spin" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles size={12} className="text-white" />
                </div>
              </div>
              <p className="text-gray-900 font-bold text-lg">AI is preparing your application…</p>
              <p className="text-sm text-gray-500 mt-1">Generating cover letter & answers from your profile</p>
            </div>
          )}

          {/* Success State */}
          {submitted && (
            <div className="flex-1 flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-sm text-gray-500 mb-8 text-center max-w-sm">
                Your application for <strong>{jobTitle}</strong> at <strong>{company}</strong> has been saved. You can track its status in the Tracker.
              </p>
              <div className="flex gap-3">
                {applyLink && (
                  <a
                    href={applyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 no-underline"
                  >
                    <ExternalLink size={14} /> Also apply on {platform || 'site'}
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#6632CA] text-white rounded-xl font-semibold text-sm hover:bg-[#5b2cb5] transition-colors shadow-md shadow-purple-600/20"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!loading && !submitted && data && (
            <>
              {/* AI Disclosure Bar */}
              <div className="bg-amber-50/70 border-b border-amber-100 px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700 text-[11px] font-bold uppercase tracking-tight">
                  <AlertTriangle size={13} /> AI-Generated — Review Before Submitting
                </div>
                <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-bold uppercase tracking-tight">
                  <ShieldCheck size={13} /> Profile-Verified Content
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-100 bg-white px-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-[13px] font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'border-[#6632CA] text-[#6632CA]'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/40" style={{ minHeight: 280 }}>

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-[#6632CA]" />
                        <h4 className="text-sm font-bold text-gray-900">Personal Information</h4>
                        <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Edit3 size={10} /> Editable</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quality Report */}
                    {data.quality_report && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Info size={16} className="text-[#6632CA]" /> Quality Report
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Overall</p>
                            <p className={`font-bold text-sm ${data.quality_report.overall_quality === 'high' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {data.quality_report.overall_quality === 'high' ? '✓ High Quality' : '⚠ Needs Review'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Cover Letter</p>
                            <p className="font-bold text-sm text-gray-700">{data.quality_report.cover_letter_word_count} words</p>
                          </div>
                        </div>
                        {data.quality_report.quality_notes && (
                          <p className="text-xs text-gray-500 mt-3 font-medium">{data.quality_report.quality_notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Cover Letter Tab */}
                {activeTab === 'cover_letter' && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={16} className="text-[#6632CA]" /> Cover Letter
                      </label>
                      <span className="text-[11px] text-gray-400 font-bold">{editedCoverLetter.split(' ').filter(Boolean).length} words</span>
                    </div>
                    <textarea
                      value={editedCoverLetter}
                      onChange={(e) => setEditedCoverLetter(e.target.value)}
                      className="flex-1 w-full p-5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700 font-medium leading-relaxed resize-none text-sm"
                      style={{ minHeight: 260 }}
                      placeholder="Your cover letter will appear here..."
                    />
                  </div>
                )}

                {/* Answers Tab */}
                {activeTab === 'answers' && (
                  <div className="space-y-5">
                    {editedAnswers.map((ans, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500">Q{idx + 1}</span>
                          {ans.confidence && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ans.confidence === 'high' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {ans.confidence} confidence
                            </span>
                          )}
                        </div>
                        <div className="p-5">
                          <p className="text-sm font-bold text-gray-900 mb-3">{ans.question}</p>
                          <textarea
                            value={ans.answer}
                            onChange={(e) => handleAnswerChange(idx, e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-700 font-medium text-sm leading-relaxed"
                            rows={4}
                          />
                          {ans.confidence_reason && (
                            <p className="mt-2 text-[11px] text-gray-400 italic font-medium">AI: {ans.confidence_reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {editedAnswers.length === 0 && (
                      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                        <MessageSquare size={40} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 font-bold text-sm">No custom questions for this job</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer with Submit */}
              <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {applyLink && (
                  <a
                    href={applyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5 no-underline"
                  >
                    <ExternalLink size={14} /> External
                  </a>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !fullName.trim() || !email.trim()}
                  className="flex-1 bg-[#6632CA] hover:bg-[#5b2cb5] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
