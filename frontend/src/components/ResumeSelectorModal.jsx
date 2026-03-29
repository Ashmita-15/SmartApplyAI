import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Check, Loader2, X, Plus } from 'lucide-react'
import { getResumes } from '@/services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function ResumeSelectorModal({ isOpen, onClose, onSelect, title = "Select a Resume" }) {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      loadResumes()
    }
  }, [isOpen])

  const loadResumes = async () => {
    setLoading(true)
    try {
      const res = await getResumes()
      setResumes(res.data.resumes || [])
    } catch (e) {
      toast.error('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (resumeId) => {
    localStorage.setItem('selected_resume_id', resumeId)
    onSelect(resumeId)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
                  <p className="text-gray-500 font-medium">Loading resumes...</p>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-gray-300" size={32} />
                  </div>
                  <p className="text-gray-900 font-bold mb-1">No resumes found</p>
                  <p className="text-gray-500 text-sm mb-6">You need to upload a resume in your profile first.</p>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 mx-auto text-purple-600 font-bold hover:text-purple-700 transition-colors"
                  >
                    <Plus size={18} /> Go to Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4 font-medium">Which resume would you like to use for this action?</p>
                  {resumes.map((resume) => {
                    const isSelected = localStorage.getItem('selected_resume_id') === resume.id
                    return (
                      <button
                        key={resume.id}
                        onClick={() => handleSelect(resume.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                          isSelected 
                            ? 'border-purple-600 bg-purple-50/50 shadow-sm' 
                            : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600'
                          }`}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 truncate max-w-[200px]">{resume.filename}</p>
                            <p className="text-xs text-gray-500 font-medium">Uploaded {new Date(resume.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="bg-purple-600 text-white rounded-full p-1">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
               <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
                 Cancel
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
