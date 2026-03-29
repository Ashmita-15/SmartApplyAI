import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getJobs, triggerScrape, batchMatch } from '@/services/api'
import { JobCard } from '@/components/job/JobCard'
import { ResumeSelectorModal } from '@/components/ResumeSelectorModal'
import { Search, MapPin, Briefcase, Filter, Loader2, Target, Send, ChevronDown, Sparkles, FileStack } from 'lucide-react'
import toast from 'react-hot-toast'
import { Plus } from "lucide-react";
export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)
  const [matchResults, setMatchResults] = useState({})
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState(localStorage.getItem('selected_resume_id') || '')
  
  const [searchParams, setSearchParams] = useSearchParams()
  const [autoApplyJobId, setAutoApplyJobId] = useState(null)

  // Search state matching the UI
  const [keyword, setKeyword] = useState('')
  const [locationStr, setLocationStr] = useState('')

  useEffect(() => {
    load()
  }, [])
  
  useEffect(() => {
    const applyId = searchParams.get('applyTo')
    if (applyId) {
      setAutoApplyJobId(applyId)
      searchParams.delete('applyTo')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const load = async () => {
    setLoading(true)
    try {
      const res = await getJobs()
      setJobs(res.data.jobs || [])
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      await triggerScrape()
      toast.success('Scraping started! Refreshing jobs in 5 seconds...')
      // Wait a bit for scraper to do its thing then reload
      setTimeout(load, 5000)
    } catch (error) {
      toast.error('Failed to start scraper')
      setLoading(false)
    }
  }

  // Filter jobs purely on frontend
  const filtered = jobs.filter(j =>
    (!keyword || j.title.toLowerCase().includes(keyword.toLowerCase()) || j.company.toLowerCase().includes(keyword.toLowerCase())) &&
    (!locationStr || j.location.toLowerCase().includes(locationStr.toLowerCase()))
  ).sort((a, b) => {
    // Sort by match score if available
    const scoreA = matchResults[a.id]?.score || 0
    const scoreB = matchResults[b.id]?.score || 0
    return scoreB - scoreA
  })

  const handleClearFilters = () => {
    setKeyword('')
    setLocationStr('')
    setMatchResults({})
  }

  const handleBatchMatch = async () => {
    const rId = localStorage.getItem('selected_resume_id') || selectedResumeId
    if (!rId) {
      setIsResumeModalOpen(true)
      return
    }

    setMatching(true)
    try {
      const res = await batchMatch({ resume_id: rId })
      const matches = res.data.matches || []

      const resultsMap = {}
      matches.forEach(m => {
        resultsMap[m.job_id] = m
      })

      setMatchResults(resultsMap)
      toast.success('Jobs sorted by your best match!')
    } catch (e) {
      toast.error('Failed to analyze job matches')
    } finally {
      setMatching(false)
    }
  }

  const onResumeSelected = (resumeId) => {
    setSelectedResumeId(resumeId)
    // Automatically trigger match after selection if that's what user wanted
    setTimeout(handleBatchMatch, 100)
  }

  return (
    <div className="min-h-screen pt-[104px] pb-12 bg-[#FAFBFC]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">

        {/* Top Search Bar matching the design */}
        <div className="bg-white rounded-t-xl border-x border-t border-gray-200 shadow-sm flex flex-col md:flex-row shadow-[0px_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex-1 relative flex items-center p-2 border-b md:border-b-0 md:border-r border-gray-200 group">
            <Search className="absolute left-5 text-gray-400 w-5 h-5 group-focus-within:text-purple-600 transition-colors" />
            <input
              type="text"
              placeholder="Job title or keyword"
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none text-gray-800 font-medium placeholder:text-gray-400"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <ChevronDown className="absolute right-5 text-gray-300 w-4 h-4" />
          </div>
          <div className="flex-1 relative flex items-center p-2 group">
            <Search className="absolute left-5 text-gray-400 w-5 h-5 group-focus-within:text-purple-600 transition-colors" />
            <input
              type="text"
              placeholder="Country or timezone"
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none text-gray-800 font-medium placeholder:text-gray-400"
              value={locationStr}
              onChange={(e) => setLocationStr(e.target.value)}
            />
            <ChevronDown className="absolute right-5 text-gray-300 w-4 h-4" />
          </div>
          <div className="p-3 flex items-center border-t md:border-t-0 border-gray-200 gap-3 bg-white rounded-tr-xl">
            <button onClick={handleClearFilters} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Clear
            </button>
            <button className="bg-[#6632CA] hover:bg-[#5b2cb5] text-white px-8 py-3 rounded-lg font-semibold text-sm transition-colors shadow-md shadow-purple-600/20 whitespace-nowrap">
              Search
            </button>
          </div>
        </div>

        {/* Filter Toolbar beneath search box */}
        <div className="bg-white rounded-b-xl border border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 mb-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors">
              Company <ChevronDown size={14} className="text-gray-400" />
            </button>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors">
              Salary <ChevronDown size={14} className="text-gray-400" />
            </button>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors">
              Type of work <ChevronDown size={14} className="text-gray-400" />
            </button>
          </div>

          <button onClick={handleClearFilters} className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            Clear all
          </button>
        </div>


        {/* Main Content Area (70/30 split) */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Column (Job List) */}
          <div className="flex-[2.5]">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <button
                onClick={handleRefresh}
                disabled={loading || matching}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center gap-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Briefcase size={14} className={loading ? "animate-bounce text-purple-600" : "text-gray-400"} />
                {loading ? 'Refreshing...' : 'Refresh Jobs'}
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              <h2 className="text-[17px] font-bold text-[#4B5563]">{filtered.length.toLocaleString()} jobs</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchMatch}
                  disabled={matching || loading}
                  className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {matching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {matching ? 'Analyzing...' : 'Find Matches'}
                </button>
                <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center gap-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                  <Filter size={14} className="text-gray-400" />
                  {Object.keys(matchResults).length > 0 ? "Best Match" : "Most recent"}
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Job Cards */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
                <div className="w-8 h-8 border-2 border-[#6632CA] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Scraping fresh jobs...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <Target size={64} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-900 font-bold text-xl">No jobs found matching criteria</p>
                <p className="text-sm mt-2 text-gray-500">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    matchData={matchResults[job.id]}
                    selectedResumeId={localStorage.getItem('selected_resume_id') || selectedResumeId}
                    onSelectResume={() => setIsResumeModalOpen(true)}
                    autoOpenApply={autoApplyJobId === job.id}
                    onAnalyze={(j) => {
                      localStorage.setItem('analyze_job_id', j.id)
                      toast.success('Job selected! Go to Match tab to analyze.')
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column (Sidebar) */}
          <div className="flex-1 flex flex-col gap-6">

            {/* Selected Resume Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FileStack size={16} className="text-purple-600" />
                  Selected Resume
                </h3>
                <button
                  onClick={() => setIsResumeModalOpen(true)}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700"
                >
                  Change
                </button>
              </div>
              {selectedResumeId ? (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="w-8 h-8 rounded bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Briefcase size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">Resume Active</p>
                    <p className="text-[11px] text-purple-600 font-medium">Ready for matching</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsResumeModalOpen(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm font-bold hover:border-purple-300 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Select Resume
                </button>
              )}
            </div>

            {/* Weekly Newsletter Card */}
            <div className="bg-[#F3F1FA] rounded-xl p-6 border border-purple-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-white text-[#6632CA] flex items-center justify-center mb-4 shadow-sm">
                <Send size={18} />
              </div>
              <h3 className="font-bold text-[#1F2937] text-lg mb-2">Weekly newsletter</h3>
              <p className="text-[#6B7280] text-[13px] font-medium leading-relaxed mb-4 pr-4">
                We'll keep you updated when the best new remote jobs pop up on Himalayas.
              </p>

              <div className="mb-4">
                <input type="email" placeholder="Enter your email" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-[#6632CA] text-sm mb-2 shadow-sm" />
                <p className="text-[11px] text-gray-500 font-medium">We care about your data in our <a href="#" className="text-[#6632CA] underline underline-offset-2">privacy policy</a>.</p>
              </div>

              <button className="w-full bg-[#6632CA] hover:bg-[#5b2cb5] text-white py-3 rounded-lg font-bold text-sm shadow-md shadow-purple-600/20 transition-colors">
                Subscribe
              </button>
            </div>

            {/* Popular Searches Card */}
            <div className="bg-[#F8F9FA] rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-[#1F2937] text-lg mb-4">Popular searches</h3>

              <div className="flex flex-col gap-3">
                {[
                  { title: 'Product Designer', count: '204 jobs' },
                  { title: 'Customer Success', count: '80 jobs' },
                  { title: 'Product Manager', count: '120 jobs' },
                  { title: 'Engineering Manager', count: '64 jobs' },
                ].map(search => (
                  <div key={search.title} className="flex items-center justify-between text-[13px] group cursor-pointer hover:bg-gray-100 p-2 -mx-2 rounded-lg transition-colors">
                    <span className="font-semibold text-gray-700 group-hover:text-gray-900">{search.title}</span>
                    <span className="font-bold text-[#6632CA]">{search.count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
      <ResumeSelectorModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onSelect={onResumeSelected}
      />
    </div>
  )
}
