import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { analyzeMatch, getSkillGap, getJobs, getResumes, getSelectionProbability } from '@/services/api'
import { BarChart3, CheckCircle, XCircle, Lightbulb, Loader2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

import { MatchScoreCard } from '@/components/ai/MatchScoreCard'
import { SkillGapDisplay } from '@/components/ai/SkillGapDisplay'
import { PredictionMeter } from '@/components/ai/PredictionMeter'

export default function Match() {
  const [jobs, setJobs] = useState([])
  const [resumes, setResumes] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [selectedResume, setSelectedResume] = useState(localStorage.getItem('selected_resume_id') || '')
  const [result, setResult] = useState(null)
  const [gapResult, setGapResult] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const analyzeJobId = localStorage.getItem('analyze_job_id')
    loadData(analyzeJobId)
  }, [])

  const loadData = async (preselectedJobId) => {
    setDataLoading(true)
    try {
      const [jRes, rRes] = await Promise.allSettled([getJobs({ limit: 50 }), getResumes()])
      if (jRes.status === 'fulfilled') {
        setJobs(jRes.value.data.jobs || [])
        if (preselectedJobId) setSelectedJob(preselectedJobId)
      }
      if (rRes.status === 'fulfilled') setResumes(rRes.value.data.resumes || [])
    } catch {}
    setDataLoading(false)
  }

  const analyze = async () => {
    if (!selectedJob || !selectedResume) {
      toast.error('Please select both a resume and a job')
      return
    }
    setLoading(true)
    setResult(null)
    setGapResult(null)
    try {
      const [matchRes, gapRes, probRes] = await Promise.all([
        analyzeMatch({ resume_id: selectedResume, job_id: selectedJob }),
        getSkillGap({ resume_id: selectedResume, job_id: selectedJob }),
        getSelectionProbability({ resume_id: selectedResume, job_id: selectedJob })
      ])
      setResult(matchRes.data)
      setGapResult(gapRes.data)
      setPrediction(probRes.data.prediction)
    } finally {
      // Mock result fallback if error since backend might not be fully functional
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#FAFBFC]">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <BarChart3 size={24} />
            </div>
            Match Analysis
          </h1>
          <p className="text-sm mt-2 text-gray-500">
            AI-powered resume-to-job fit scoring and skill gap analysis
          </p>
        </motion.div>

        {/* Selectors */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="text-sm block mb-2 font-medium text-gray-700">Select Resume</label>
              <select className="input-field" value={selectedResume} onChange={(e) => setSelectedResume(e.target.value)}>
                <option value="">-- Choose resume --</option>
                {resumes.map(r => <option key={r.id} value={r.id}>{r.filename}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm block mb-2 font-medium text-gray-700">Select Job</label>
              <select className="input-field" value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}>
                <option value="">-- Choose job --</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} @ {j.company}</option>)}
              </select>
            </div>
          </div>
          <button onClick={analyze} disabled={loading || !selectedJob || !selectedResume}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base shadow-md shadow-purple-600/20">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <BarChart3 size={20} />}
            {loading ? 'Analyzing...' : 'Analyze Match Score'}
          </button>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Top Score Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MatchScoreCard score={result.score} />
              {prediction && <PredictionMeter prediction={prediction} />}
            </div>

            {/* Strategic Advice Banner */}
            {result.strategic_advice && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group"
              >
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-sm">
                    <Award size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1 flex items-center gap-2">
                       Strategic Advice
                       <span className="text-[10px] bg-white text-purple-600 px-2 py-0.5 rounded-full font-bold tracking-wider">MASTER AGENT v2.0</span>
                    </h4>
                    <p className="text-purple-50 font-medium leading-relaxed max-w-2xl">{result.strategic_advice}</p>
                  </div>
                </div>
                <TrendingUp size={120} className="absolute -right-8 -bottom-8 text-white/10 group-hover:scale-110 transition-transform duration-700" />
              </motion.div>
            )}

            {/* Detailed Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-7">
                 <RequirementMap requirements={result.requirement_map} />
               </div>
               <div className="lg:col-span-5">
                 <SkillGapPanel suggestions={result.improvement_suggestions} />
               </div>
            </div>

            {/* Legacy Skill Gap (for secondary check) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                 <TrendingUp className="text-emerald-500" size={20} />
                 <h3 className="text-lg font-bold text-gray-900">Skill Comparison</h3>
               </div>
               <SkillGapDisplay 
                missingSkills={result.missing_skills || []} 
                matchingSkills={result.matching_skills || []}
                recommendations={gapResult?.recommendations || []}
              />
            </div>
          </motion.div>
        )}

        {!result && !loading && (
          <div className="card p-16 text-center border border-gray-200 shadow-sm bg-white">
            <div className="w-20 h-20 rounded-full mx-auto bg-gray-50 flex items-center justify-center mb-5">
               <BarChart3 size={40} className="text-gray-300" />
            </div>
            <p className="text-gray-900 font-bold text-lg mb-2">Select a resume and job to start analysis</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Our AI will evaluate your fit, highlight skill gaps, and provide a personalized learning path to help you land the role.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
