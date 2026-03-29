import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { 
  X, CloudUpload, FileText, Download, Trash2, ChevronRight, 
  Copy, BarChart, Zap, Folder, CheckCircle, Search, Menu,
  Loader2, Activity, TrendingUp, Briefcase, Award
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '@/services/api'

export default function Dashboard() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState([])
  const [stats, setStats] = useState({
    applied_count: 0,
    interviews_count: 0,
    offers_count: 0,
    match_success_rate: 0,
    recent_activities: [],
    total_resumes: 0
  })
  const [selectedTab, setSelectedTab] = useState('upload')

  useEffect(() => {
     loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsRes, resumesRes] = await Promise.all([
        api.getDashboardStats(),
        api.getResumes()
      ])
      setStats(statsRes.data)
      setResumes(resumesRes.data.resumes || [])
    } catch (error) {
      console.error("Dashboard load error:", error)
      toast.error("Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file.')
      return
    }

    try {
      const loadingToast = toast.loading(`Uploading ${file.name}...`)
      await api.uploadResume(file)
      toast.dismiss(loadingToast)
      toast.success('Resume uploaded and parsed!')
      loadData() // Refresh
    } catch (error) {
      toast.error('Upload failed')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* 3 Column Grid Layout matching the reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Col span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Connect With Us Card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Zap className="text-blue-500" size={20} />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Connect with us!</h3>
                <p className="text-[12px] text-gray-400 font-medium leading-tight mt-0.5 w-[140px]">
                  Join us in this dynamic group and grow together.
                </p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors shrink-0">
              <X size={14} />
            </button>
          </motion.div>

          {/* Storage / Activity Chart Card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold tracking-tight text-gray-900">Activity</h3>
              <button className="px-3 py-1.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl bg-white shadow-sm flex items-center gap-1 hover:bg-gray-50">
                Month <ChevronRight size={12} className="rotate-90" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mb-8">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Applied ({stats.applied_count})</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Interviews ({stats.interviews_count})</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Offers ({stats.offers_count})</span>
            </div>

            {/* Simulated Bar Chart */}
            <div className="relative h-48 flex items-end justify-between px-2">
              {/* Y Axis lines */}
              <div className="absolute inset-0 flex flex-col justify-between z-0">
                <div className="border-b border-gray-100 w-full h-0"></div>
                <div className="border-b border-gray-100 w-full h-0"></div>
                <div className="border-b border-gray-100 w-full h-0"></div>
                <div className="border-b border-gray-100 w-full h-0"></div>
                <div className="border-b border-gray-100 w-full h-0"></div>
              </div>
              
              {/* Bars */}
              {[
                { blue: 'h-[20%]', purple: 'h-[30%]', green: 'h-[40%]' },
                { blue: 'h-[40%]', purple: 'h-[10%]', green: 'h-[45%]' },
                { blue: 'h-[60%]', purple: 'h-[20%]', green: 'h-[10%]' },
                { blue: 'h-[30%]', purple: 'h-[40%]', green: 'h-[20%]' },
                { blue: 'h-[50%]', purple: 'h-[25%]', green: 'h-[15%]' }
              ].map((h, i) => (
                <div key={i} className="flex flex-col gap-1 w-3 z-10 items-center justify-end h-full py-1">
                  <div className={`w-full rounded-full bg-green-400 ${h.green}`}></div>
                  <div className={`w-full rounded-full bg-purple-500 ${h.purple}`}></div>
                  <div className={`w-full rounded-full bg-blue-600 ${h.blue}`}></div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-[11px] font-bold text-gray-400 mt-4 px-1">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
            </div>
          </motion.div>

          {/* AI Banner Card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-[#E2E6FF] to-[#D5C6FF] rounded-3xl p-6 shadow-sm relative overflow-hidden h-[200px]">
            <h3 className="text-xl font-bold text-indigo-900 w-[140px] leading-tight mb-6 relative z-10">
              How AI assist your application?
            </h3>
            <button className="bg-indigo-950 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md relative z-10 hover:bg-indigo-900 transition-colors">
              Learn More
            </button>
            
            {/* Abstract Shape / Graphic */}
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-gradient-to-tr from-blue-400 to-cyan-300 rounded-full blur-[2px] opacity-80 border-[16px] border-[#ced6ff] shadow-inner flex items-center justify-center -rotate-12">
               <div className="w-16 h-16 bg-[#D5C6FF] rounded-full shadow-inner"></div>
            </div>
          </motion.div>

        </div>

        {/* Middle Column (Col span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Upload Area Card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
            
            {/* Top Toggle */}
            <div className="flex bg-[#F8F9FA] p-1.5 rounded-2xl mb-6">
              <button 
                onClick={() => setSelectedTab('upload')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedTab === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Upload
              </button>
              <button 
                onClick={() => setSelectedTab('download')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedTab === 'download' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Saved
              </button>
            </div>

            {/* Drag & Drop Canvas */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-[1.5px] border-dashed border-blue-400/60 rounded-3xl bg-[#F6F8FF] flex flex-col items-center justify-center p-12 text-center cursor-pointer hover:bg-blue-50/80 transition-colors relative mb-6"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.doc,.docx"
              />
              <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 z-10 relative">
                <CloudUpload size={28} />
              </div>
              <p className="text-sm font-bold text-gray-600 mb-1">Drag & drop or click to</p>
              <p className="text-sm font-bold text-gray-600">choose files</p>
              
              {/* Decorative floating element inside canvas */}
              <div className="absolute top-8 right-12 bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md rotate-[5deg] flex items-center gap-1 cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 cursor-pointer hover:scale-150 transition-transform"></div> main_resume.pdf
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 px-2 mb-8">
              <span>Supported formats: PDF, DOCX</span>
              <span>Max: 10MB</span>
            </div>

            {/* List of Resumes */}
            <div className="flex flex-col gap-4 flex-1">
              {resumes.slice(0, 3).map((resume, idx) => (
                <div key={resume.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0 shadow-md transform group-hover:-translate-y-1 transition-transform">
                     <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-gray-900 truncate pr-4">{resume.filename}</h4>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">
                      Matches: {resume.skills?.length || 0} skills
                    </p>
                  </div>
                </div>
              ))}
              {resumes.length === 0 && (
                <div className="text-center py-4 border border-dashed border-gray-100 rounded-2xl">
                  <p className="text-xs font-bold text-gray-400">No resumes yet</p>
                </div>
              )}
            </div>

          </motion.div>

          {/* Stats Callout Card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <div className="bg-gradient-to-r from-[#F4F9FF] to-[#E5FAFD] rounded-2xl py-8 flex items-center justify-center mb-6 border border-blue-50/50">
               <h2 className="text-5xl font-black text-gray-900 tracking-tighter shadow-sm mix-blend-multiply">
                 {Math.round(stats.match_success_rate * 100)}%
               </h2>
             </div>
             <div className="flex justify-between items-end px-2">
               <div>
                 <h3 className="font-bold text-gray-900 text-base">Match Success</h3>
                 <p className="text-xs text-gray-500 font-medium tracking-tight mt-0.5">Average across all applications</p>
               </div>
               <Link to="/tracker" className="bg-red-50 text-red-600 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-red-100 transition-colors">
                 Details
               </Link>
             </div>
          </motion.div>

        </div>

        {/* Right Column (Col span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Folders Feature */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative h-[250px] mb-4">
             {/* Back Folder */}
             <div className="absolute top-4 right-0 lg:-right-4 w-[90%] bg-blue-500 rounded-3xl p-6 shadow-lg rotate-[4deg] transition-transform hover:rotate-[6deg] cursor-pointer h-[190px]">
               <div className="flex justify-between text-white/90">
                 <div>
                   <h3 className="font-bold text-lg mb-0.5">Data Sci</h3>
                   <p className="text-xs font-semibold opacity-80">14 jobs</p>
                 </div>
                 <button className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm"><Menu size={14}/></button>
               </div>
             </div>
             
             {/* Front Folder */}
             <div className="absolute top-12 left-0 w-[95%] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 border border-gray-100 z-10 transition-transform hover:-translate-y-2 cursor-pointer h-[190px] flex flex-col">
               <div className="flex justify-between items-start mb-auto">
                 <div className="flex items-center font-bold text-gray-900 gap-2 text-lg">
                   <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                     <Folder size={18} />
                   </div>
                   Frontend
                 </div>
                 <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50"><Menu size={14}/></button>
               </div>
               <p className="text-xs text-gray-500 font-bold mb-4 ml-10">42 jobs tracked</p>
               
               <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between tracking-tight text-center w-full">
                 <div className="text-[11px] font-bold bg-gray-50 px-3 py-1.5 rounded-lg text-gray-500 border border-gray-100 w-full">
                   Last Applied: 09 Feb
                 </div>
               </div>
             </div>
          </motion.div>

          {/* Shared Files (Mapped to Recent Activity) */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Recent Applied</h3>
              <button className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                See All
              </button>
            </div>
            
            <div className="flex flex-col gap-2 mb-6">
              {stats.recent_activities.length > 0 ? (
                stats.recent_activities.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-gray-50 cursor-pointer group transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                        act.type === 'application' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {act.type === 'application' ? <Briefcase size={16} /> : <FileText size={16} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{act.title}</h4>
                        <p className="text-[11px] font-bold text-gray-400">{act.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-gray-400 transition-colors">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Activity size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs font-bold text-gray-400">No activity yet</p>
                </div>
              )}
            </div>

            {/* Quick Copy Link at bottom */}
            <div className="flex items-center justify-between bg-[#F8F9FA] rounded-2xl p-1.5 border border-gray-100">
              <span className="text-xs font-bold text-gray-500 pl-3">smartapply.ai/u/jane</span>
              <button className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-sm hover:bg-gray-50 transition-colors">
                <Copy size={12} /> Copy
              </button>
            </div>

          </motion.div>

        </div>
      </div>
    </div>
  )
}
