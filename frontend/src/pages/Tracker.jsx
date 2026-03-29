import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getApplications, updateApplicationStatus } from '@/services/api'
import { subscribeToApplications } from '@/services/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ClipboardList, RefreshCw, ArrowUpDown } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['applied', 'pending', 'interview', 'offered', 'rejected', 'manual_required']
const STATUS_LABELS = {
  applied: 'Applied',
  pending: 'Pending',
  interview: 'Interview',
  offered: 'Offered',
  rejected: 'Rejected',
  manual_required: 'Manual Apply',
}

function StatusBadge({ status, editable, onUpdate, appId }) {
  const [editing, setEditing] = useState(false)
  
  // Custom light theme colors for statuses
  const statusColors = {
    applied: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
    pending: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200',
    interview: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200',
    offered: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
    rejected: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
    manual_required: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
  }
  
  const cls = statusColors[status] || statusColors.pending
  const baseClasses = `text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wide border transition-colors inline-block`

  if (!editable) return <span className={`${baseClasses} ${cls}`}>{STATUS_LABELS[status] || status}</span>

  return (
    <div className="relative inline-block">
      <button className={`${baseClasses} ${cls} cursor-pointer shadow-sm`}
        onClick={() => setEditing(!editing)}>
        {STATUS_LABELS[status] || status} <span className="ml-1 opacity-70">▾</span>
      </button>
      {editing && (
        <div className="absolute z-20 top-8 left-0 min-w-36 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => { onUpdate(appId, s); setEditing(false) }}
              className={`block w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                status === s ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Tracker() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('applied_at')
  const [sortDir, setSortDir] = useState('desc')
  const [filterStatus, setFilterStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getApplications()
      setApplications(res.data.applications || [])
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    // Realtime subscription
    if (user?.id) {
      const sub = subscribeToApplications(user.id, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setApplications(prev => prev.map(a =>
            a.id === payload.new.id ? { ...a, ...payload.new } : a
          ))
        } else if (payload.eventType === 'INSERT') {
          load()
        }
      })
      return () => sub?.unsubscribe?.()
    }
  }, [user?.id, load])

  const handleStatusUpdate = async (appId, status) => {
    try {
      await updateApplicationStatus(appId, status)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
      toast.success(`Status updated to "${STATUS_LABELS[status]}"`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = applications
    .filter(a => !filterStatus || a.status === filterStatus)
    .sort((a, b) => {
      let av = sortField === 'applied_at' ? new Date(a.applied_at) : (a.jobs?.title || a.job_id)
      let bv = sortField === 'applied_at' ? new Date(b.applied_at) : (b.jobs?.title || b.job_id)
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length
    return acc
  }, {})

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#FAFBFC]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ClipboardList size={22} />
                </div>
                Application Tracker
              </h1>
              <p className="text-sm mt-2 text-gray-500 font-medium">
                {applications.length} total applications • Real-time status updates
              </p>
            </div>
            <button onClick={load} className="btn-secondary flex items-center gap-2 w-fit bg-white border-gray-200">
              <RefreshCw size={16} className="text-gray-500" /> <span className="text-gray-700 font-semibold">Sync Data</span>
            </button>
          </div>
        </motion.div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          <button onClick={() => setFilterStatus('')}
            className={`text-xs px-4 py-2 rounded-full font-bold transition-all shadow-sm border ${
              !filterStatus ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            All ({applications.length})
          </button>
          {STATUS_OPTIONS.filter(s => statusCounts[s] > 0).map(s => {
            const isActive = filterStatus === s
            // Mapping for dynamic background based on selection
            const activeColor = {
              applied: 'bg-blue-600 border-blue-600 text-white',
              pending: 'bg-indigo-600 border-indigo-600 text-white',
              interview: 'bg-purple-600 border-purple-600 text-white',
              offered: 'bg-green-600 border-green-600 text-white',
              rejected: 'bg-red-600 border-red-600 text-white',
              manual_required: 'bg-yellow-500 border-yellow-500 text-white',
            }[s]
            
            return (
              <button key={s} onClick={() => setFilterStatus(s === filterStatus ? '' : s)}
                className={`text-xs px-4 py-2 rounded-full font-bold transition-all shadow-sm border ${
                  isActive ? activeColor : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                {STATUS_LABELS[s]} ({statusCounts[s]})
              </button>
            )
          })}
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-gray-50">
              <ClipboardList size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-900 font-bold text-xl">No applications to show</p>
              <p className="text-sm mt-2 text-gray-500 max-w-sm mx-auto">When you apply to jobs, they will automatically appear here so you can track your progress.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors" onClick={() => toggleSort('title')}>
                        Role <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Resume Profile</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors" onClick={() => toggleSort('applied_at')}>
                        Applied On <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {filtered.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{app.jobs?.title || '—'}</td>
                      <td className="p-4 text-gray-700 font-medium">{app.jobs?.company || '—'}</td>
                      <td className="p-4">
                        <span className="text-xs font-bold px-2.5 py-1 box-border rounded-md bg-gray-100 text-gray-600 capitalize">
                          {app.jobs?.platform || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                        {app.resumes?.filename || '—'}
                      </td>
                      <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : '—'}
                      </td>
                      <td className="p-4">
                        <StatusBadge
                          status={app.status}
                          editable={true}
                          onUpdate={handleStatusUpdate}
                          appId={app.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
