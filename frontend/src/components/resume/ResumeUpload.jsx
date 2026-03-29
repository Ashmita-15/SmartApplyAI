import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react'
import { uploadResume } from '@/services/api'
import toast from 'react-hot-toast'

export default function ResumeUpload({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(null)

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file')
      return
    }
    setUploading(true)
    try {
      const res = await uploadResume(file)
      setUploaded(res.data)
      toast.success(`Resume parsed! Found ${res.data.skill_count} skills.`)
      onUploadSuccess && onUploadSuccess(res.data)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [])

  const onFileInput = (e) => {
    handleFile(e.target.files[0])
  }

  return (
    <div className="w-full h-full flex flex-col p-4">
      <motion.label
        className={`flex-1 flex flex-col items-center justify-center cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 bg-white hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        whileHover={{ scale: 1.01 }}
      >
        <input type="file" accept=".pdf" className="hidden" onChange={onFileInput} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 size={40} className="animate-spin text-purple-600" />
          ) : uploaded ? (
            <CheckCircle size={40} className="text-green-500" />
          ) : (
            <Upload size={40} className={dragging ? "text-purple-600" : "text-gray-400"} />
          )}
          <div>
            <p className="font-bold text-gray-900">
              {uploading ? 'Parsing resume...' : uploaded ? 'Resume uploaded!' : 'Drop your resume here'}
            </p>
            <p className="text-sm mt-1 text-gray-500">
              {uploaded ? uploaded.filename : 'PDF format only • Click or drag & drop'}
            </p>
          </div>
        </div>
      </motion.label>

      {uploaded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3 text-purple-700">
            <FileText size={16} />
            <span className="text-sm font-bold">Extracted Skills ({uploaded.skills?.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(uploaded.skills || []).map((skill) => (
              <span key={skill} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{skill}</span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
