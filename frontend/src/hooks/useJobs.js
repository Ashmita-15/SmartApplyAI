import { useState, useEffect, useCallback } from 'react'
import { getJobs } from '@/services/api'

export function useJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  const fetchJobs = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getJobs(filters)
      setJobs(res.data.jobs || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return { jobs, loading, error, total, refetch: fetchJobs }
}
