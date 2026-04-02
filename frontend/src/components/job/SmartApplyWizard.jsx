import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sparkles, FileText, CheckCircle2, Loader2, Info,
  MessageSquare, Send, User, Mail, Phone, ExternalLink,
  Edit3, ShieldCheck, AlertTriangle, ChevronRight, ChevronLeft,
  Copy, Check, Target, TrendingUp, Award, BookOpen,
  Clock, Briefcase, ArrowRight, Clipboard
} from 'lucide-react'
import { smartApplyPrepare, applyToJob, getResumes } from '@/services/api'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 'resume', label: 'Select Resume', icon: FileText },
  { id: 'analysis', label: 'Match Analysis', icon: Target },
  { id: 'review', label: 'Review & Edit', icon: Edit3 },
  { id: 'confirm', label: 'Confirm', icon: CheckCircle2 },
]

export function SmartApplyWizard({ isOpen, onClose, job }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  // Step 1: Resume
  const [resumes, setResumes] = useState([])
  const [resumesLoading, setResumesLoading] = useState(true)
  const [selectedResumeId, setSelectedResumeId] = useState(localStorage.getItem('selected_resume_id') || '')

  // Step 2-3: Analysis + Content
  const [preparing, setPreparing] = useState(false)
  const [prepData, setPrepData] = useState(null)

  // Step 3: Editable fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [editedCoverLetter, setEditedCoverLetter] = useState('')
  const [editedAnswers, setEditedAnswers] = useState([])
  const [reviewTab, setReviewTab] = useState('cover_letter')

  // Step 4: Confirm
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [checklist, setChecklist] = useState({ reviewed: false, aiAware: false })

  // Clipboard
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setSubmitted(false)
      setPrepData(null)
      setChecklist({ reviewed: false, aiAware: false })
      loadResumes()
    }
  }, [isOpen])

  const loadResumes = async () => {
    setResumesLoading(true)
    try {
      const res = await getResumes()
      setResumes(res.data.resumes || [])
    } catch {
      toast.error('Failed to load resumes')
    } finally {
      setResumesLoading(false)
    }
  }

  const handleResumeSelect = (id) => {
    setSelectedResumeId(id)
    localStorage.setItem('selected_resume_id', id)
  }

  const handlePrepare = async () => {
    setPreparing(true)
    setStep(1)
    try {
      const res = await smartApplyPrepare({ job_id: job.id, resume_id: selectedResumeId })
      if (res.data.error === 'INCOMPLETE_PROFILE') {
        toast.error(res.data.user_message)
        onClose()
        return
      }
      const d = res.data
      setPrepData(d)
      const p = d.autofill_payload || {}
      setFullName(p.full_name || '')
      setEmail(p.email || '')
      setPhone(p.phone || '')
      setEditedCoverLetter(p.cover_letter || '')
      setEditedAnswers(p.answers || [])
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to prepare application')
      setStep(0)
    } finally {
      setPreparing(false)
    }
  }

  const handleSubmit = async (openExternal = true) => {
    if (submitting) return
    setSubmitting(true)
    try {
      await applyToJob({
        job_id: job.id,
        resume_id: selectedResumeId,
        user_details: {
          full_name: fullName,
          email,
          phone,
          cover_letter: editedCoverLetter,
          answers: editedAnswers,
        }
      })
      setSubmitted(true)
      toast.success('Application saved successfully!')
      if (openExternal && job.apply_link) {
        window.open(job.apply_link, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswerChange = (idx, value) => {
    const updated = [...editedAnswers]
    updated[idx] = { ...updated[idx], answer: value }
    setEditedAnswers(updated)
  }

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast.success(`${fieldName} copied!`, { duration: 1500 })
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  if (!isOpen || !job) return null

  const ma = prepData?.match_analysis
  const qr = prepData?.quality_report

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(10, 10, 30, 0.55)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[720px] max-h-[94vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.92, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── Header ─── */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6632CA] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg shadow-purple-400/25">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-gray-900">Smart Apply</h3>
                  <p className="text-xs text-gray-500 font-semibold">{job.title} · {job.company}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Step indicator */}
            {!submitted && (
              <div className="flex items-center gap-1">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all w-full justify-center ${
                      i === step ? 'bg-purple-100 text-[#6632CA]' :
                      i < step ? 'bg-emerald-50 text-emerald-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {i < step ? <Check size={12} /> : <s.icon size={12} />}
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden">{i + 1}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-4 h-0.5 mx-0.5 rounded shrink-0 ${i < step ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Body ─── */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* ═══ STEP 0: Select Resume ═══ */}
              {step === 0 && (
                <motion.div key="resume" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
                  <h4 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <FileText size={18} className="text-[#6632CA]" /> Which resume do you want to use?
                  </h4>
                  <p className="text-xs text-gray-500 mb-5">AI will analyze this against the job requirements</p>

                  {resumesLoading ? (
                    <div className="flex flex-col items-center py-16">
                      <Loader2 className="w-8 h-8 text-[#6632CA] animate-spin mb-3" />
                      <p className="text-gray-500 font-medium text-sm">Loading resumes…</p>
                    </div>
                  ) : resumes.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-900 font-bold mb-1">No resumes uploaded</p>
                      <p className="text-sm text-gray-500 mb-5">Upload a resume in your profile first</p>
                      <button onClick={() => { onClose(); navigate('/profile') }}
                        className="px-5 py-2.5 bg-[#6632CA] text-white rounded-xl font-bold text-sm hover:bg-[#5b2cb5] transition-colors">
                        Go to Profile
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resumes.map((r) => (
                        <button key={r.id} onClick={() => handleResumeSelect(r.id)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                            selectedResumeId === r.id
                              ? 'border-[#6632CA] bg-purple-50/60 shadow-sm'
                              : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              selectedResumeId === r.id ? 'bg-[#6632CA] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600'
                            }`}>
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{r.filename}</p>
                              <p className="text-[11px] text-gray-500 font-medium">{r.skills?.length || 0} skills detected · {new Date(r.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {selectedResumeId === r.id && (
                            <div className="bg-[#6632CA] text-white rounded-full p-1 shadow-sm">
                              <Check size={14} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═══ STEP 1: Match Analysis ═══ */}
              {step === 1 && (
                <motion.div key="analysis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
                  {preparing ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center">
                          <Loader2 className="w-10 h-10 text-[#6632CA] animate-spin" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center shadow-md">
                          <Sparkles size={16} className="text-white" />
                        </div>
                      </div>
                      <p className="text-gray-900 font-bold text-lg mb-1">AI is analyzing your fit…</p>
                      <p className="text-sm text-gray-500 text-center max-w-xs">Computing match score, generating cover letter, and preparing answers</p>
                    </div>
                  ) : ma && (
                    <div className="space-y-5">
                      {/* Score Ring */}
                      <div className="flex items-center gap-6 bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-2xl p-5 border border-gray-200">
                        <div className="relative w-24 h-24 shrink-0">
                          <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                            <circle cx="50" cy="50" r="42" fill="none"
                              stroke={ma.score >= 70 ? '#10b981' : ma.score >= 40 ? '#f59e0b' : '#ef4444'}
                              strokeWidth="8" strokeLinecap="round"
                              strokeDasharray={`${ma.score * 2.64} 264`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-black text-gray-900">{ma.score}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Match Score</p>
                          <p className={`text-lg font-black ${ma.score >= 70 ? 'text-emerald-600' : ma.score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {ma.score >= 70 ? 'Strong Match' : ma.score >= 40 ? 'Moderate Match' : 'Needs Work'}
                          </p>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            Selection: <span className="font-bold text-gray-700">{ma.selection_probability}</span>
                          </p>
                        </div>
                      </div>

                      {/* Strategic Advice */}
                      <div className="bg-gradient-to-r from-[#6632CA] to-indigo-600 rounded-2xl p-4 text-white">
                        <div className="flex items-start gap-3">
                          <Award size={20} className="text-purple-200 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200 mb-1">Strategic Advice</p>
                            <p className="text-sm font-medium leading-relaxed text-purple-50">{ma.strategic_advice}</p>
                          </div>
                        </div>
                      </div>

                      {/* Skills Breakdown */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <TrendingUp size={16} className="text-[#6632CA]" /> Skills Breakdown
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(ma.matching_skills || []).map(s => (
                            <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
                              <Check size={10} /> {s}
                            </span>
                          ))}
                          {(ma.missing_hard_skills || []).map(s => (
                            <span key={s} className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1">
                              <X size={10} /> {s}
                            </span>
                          ))}
                          {(ma.missing_soft_skills || []).map(s => (
                            <span key={s} className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold flex items-center gap-1">
                              <AlertTriangle size={10} /> {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Improvement Suggestions */}
                      {(ma.improvement_suggestions || []).length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <BookOpen size={16} className="text-amber-500" /> Resume Tips
                          </h4>
                          <div className="space-y-2">
                            {ma.improvement_suggestions.slice(0, 3).map((s, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl">
                                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{s.gap}</p>
                                  <p className="text-[11px] text-gray-600 mt-0.5">{s.action}</p>
                                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={9} /> {s.timeframe}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═══ STEP 2: Review & Edit ═══ */}
              {step === 2 && prepData && (
                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {/* AI Disclosure */}
                  <div className="bg-amber-50/70 border-b border-amber-100 px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700 text-[11px] font-bold uppercase tracking-tight">
                      <AlertTriangle size={13} /> AI-Generated — Review Before Submitting
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-bold uppercase tracking-tight">
                      <ShieldCheck size={13} /> Profile-Verified
                    </div>
                  </div>

                  {/* Tab Nav */}
                  <div className="flex border-b border-gray-100 bg-white px-2">
                    {[
                      { id: 'cover_letter', label: 'Cover Letter', icon: FileText },
                      { id: 'answers', label: `Answers (${editedAnswers.length})`, icon: MessageSquare },
                      { id: 'details', label: 'Your Details', icon: User },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setReviewTab(tab.id)}
                        className={`flex-1 py-3 text-[13px] font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                          reviewTab === tab.id ? 'border-[#6632CA] text-[#6632CA]' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <tab.icon size={14} /> {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6 bg-gray-50/40" style={{ minHeight: 260 }}>

                    {/* Cover Letter */}
                    {reviewTab === 'cover_letter' && (
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={16} className="text-[#6632CA]" /> Cover Letter
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400 font-bold">{editedCoverLetter.split(' ').filter(Boolean).length} words</span>
                            <button onClick={() => copyToClipboard(editedCoverLetter, 'Cover Letter')}
                              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1 transition-colors">
                              {copiedField === 'Cover Letter' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                              {copiedField === 'Cover Letter' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <textarea value={editedCoverLetter} onChange={(e) => setEditedCoverLetter(e.target.value)}
                          className="w-full p-5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700 font-medium leading-relaxed resize-none text-sm"
                          style={{ minHeight: 240 }} placeholder="Your cover letter will appear here…"
                        />
                      </div>
                    )}

                    {/* Answers */}
                    {reviewTab === 'answers' && (
                      <div className="space-y-5">
                        {editedAnswers.map((ans, idx) => (
                          <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-500">Q{idx + 1}</span>
                              <div className="flex items-center gap-2">
                                {ans.confidence && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    ans.confidence === 'high' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                  }`}>{ans.confidence}</span>
                                )}
                                <button onClick={() => copyToClipboard(ans.answer || '', `Answer ${idx + 1}`)}
                                  className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] font-bold text-gray-500 hover:bg-gray-50 flex items-center gap-1 transition-colors">
                                  {copiedField === `Answer ${idx + 1}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                  {copiedField === `Answer ${idx + 1}` ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                            </div>
                            <div className="p-5">
                              <p className="text-sm font-bold text-gray-900 mb-3">{ans.question}</p>
                              <textarea value={ans.answer || ''} onChange={(e) => handleAnswerChange(idx, e.target.value)}
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
                          <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                            <MessageSquare size={40} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-400 font-bold text-sm">No questions detected for this job</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Details */}
                    {reviewTab === 'details' && (
                      <div className="space-y-5">
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                          <div className="flex items-center gap-2 mb-1">
                            <User size={16} className="text-[#6632CA]" />
                            <h4 className="text-sm font-bold text-gray-900">Personal Information</h4>
                            <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Edit3 size={10} /> Editable</span>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone</label>
                              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                        {/* Quality Report */}
                        {qr && (
                          <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <Info size={16} className="text-[#6632CA]" /> Quality Report
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Overall</p>
                                <p className={`font-bold text-sm ${qr.overall_quality === 'high' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {qr.overall_quality === 'high' ? '✓ High Quality' : '⚠ Needs Review'}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Cover Letter</p>
                                <p className="font-bold text-sm text-gray-700">{qr.cover_letter_word_count} words</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══ STEP 3: Confirm & Submit ═══ */}
              {step === 3 && !submitted && (
                <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 mx-auto flex items-center justify-center mb-4">
                      <Send size={28} className="text-[#6632CA]" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Ready to Apply</h4>
                    <p className="text-sm text-gray-500 mt-1">Review the summary below and confirm</p>
                  </div>

                  {/* Summary Cards */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Briefcase size={16} className="text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 font-bold">Job</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{job.title} at {job.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FileText size={16} className="text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 font-bold">Resume</p>
                        <p className="text-sm font-bold text-gray-900">{prepData?.resume_used?.filename || 'Selected'}</p>
                      </div>
                    </div>
                    {ma && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Target size={16} className="text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-bold">Match Score</p>
                          <p className={`text-sm font-bold ${ma.score >= 70 ? 'text-emerald-600' : ma.score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>{ma.score}%</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 mb-6">
                    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={checklist.reviewed} onChange={(e) => setChecklist(c => ({ ...c, reviewed: e.target.checked }))}
                        className="w-4 h-4 text-[#6632CA] border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">I have reviewed and edited all AI-generated content</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={checklist.aiAware} onChange={(e) => setChecklist(c => ({ ...c, aiAware: e.target.checked }))}
                        className="w-4 h-4 text-[#6632CA] border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">I understand this content was AI-generated from my profile</span>
                    </label>
                  </div>

                  {/* Platform warning */}
                  {prepData?.platform_notes?.tos_warning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                      <p className="text-xs font-medium text-amber-700">{prepData.platform_notes.tos_warning}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═══ SUCCESS ═══ */}
              {submitted && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 mx-auto flex items-center justify-center mb-4">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Application Saved!</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been 
                      saved. {job.apply_link ? 'The external apply page should have opened in a new tab.' : 'Track it in the Tracker.'}
                    </p>
                  </div>

                  {/* Clipboard Helper */}
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 mb-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Clipboard size={16} className="text-[#6632CA]" /> Quick Copy — Paste into external form
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Full Name', value: fullName },
                        { label: 'Email', value: email },
                        { label: 'Phone', value: phone },
                        { label: 'Cover Letter', value: editedCoverLetter },
                        ...editedAnswers.map((a, i) => ({ label: `Answer ${i + 1}`, value: a.answer || '' })),
                      ].filter(f => f.value).map(f => (
                        <button key={f.label} onClick={() => copyToClipboard(f.value, f.label)}
                          className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all text-left">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-400 uppercase">{f.label}</p>
                            <p className="text-sm text-gray-700 font-medium truncate">{f.value.slice(0, 60)}{f.value.length > 60 ? '…' : ''}</p>
                          </div>
                          <div className="ml-3 shrink-0">
                            {copiedField === f.label ? (
                              <Check size={16} className="text-emerald-500" />
                            ) : (
                              <Copy size={16} className="text-gray-400" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ─── Footer ─── */}
          <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center gap-3">
            {/* Back / Cancel */}
            {!submitted && (
              <button onClick={step === 0 ? onClose : () => setStep(s => Math.max(0, s - 1))}
                className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                {step === 0 ? 'Cancel' : <><ChevronLeft size={14} /> Back</>}
              </button>
            )}

            {/* Step 0: Next */}
            {step === 0 && (
              <button onClick={handlePrepare} disabled={!selectedResumeId}
                className="flex-1 bg-[#6632CA] hover:bg-[#5b2cb5] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all">
                Analyze & Prepare <ChevronRight size={16} />
              </button>
            )}

            {/* Step 1: Continue */}
            {step === 1 && !preparing && prepData && (
              <button onClick={() => setStep(2)}
                className="flex-1 bg-[#6632CA] hover:bg-[#5b2cb5] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all">
                Review Application <ChevronRight size={16} />
              </button>
            )}

            {/* Step 2: Continue */}
            {step === 2 && (
              <button onClick={() => setStep(3)} disabled={!fullName.trim() || !email.trim()}
                className="flex-1 bg-[#6632CA] hover:bg-[#5b2cb5] disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all">
                Continue to Submit <ChevronRight size={16} />
              </button>
            )}

            {/* Step 3: Submit */}
            {step === 3 && !submitted && (
              <div className="flex-1 flex gap-2">
                <button onClick={() => handleSubmit(false)} disabled={submitting || !checklist.reviewed || !checklist.aiAware}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-40">
                  Save for Later
                </button>
                <button onClick={() => handleSubmit(true)} disabled={submitting || !checklist.reviewed || !checklist.aiAware}
                  className="flex-[2] bg-[#6632CA] hover:bg-[#5b2cb5] disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all">
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving…</>
                  ) : (
                    <><ExternalLink size={16} /> Save & Open External</>
                  )}
                </button>
              </div>
            )}

            {/* Success: Done */}
            {submitted && (
              <div className="flex-1 flex gap-3">
                {job.apply_link && (
                  <a href={job.apply_link} target="_blank" rel="noreferrer"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 no-underline">
                    <ExternalLink size={14} /> Re-open Apply Page
                  </a>
                )}
                <button onClick={onClose}
                  className="flex-1 bg-[#6632CA] hover:bg-[#5b2cb5] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-600/20 transition-all">
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
