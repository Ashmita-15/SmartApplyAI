import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL,
})

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_data')
      // Only redirect if not already on auth page
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const signUp = (data) => api.post('/auth/signup', data)
export const login = (data) => api.post('/auth/login', data)
export const logout = () => api.post('/auth/logout')

// Jobs
export const getJobs = (params) => api.get('/jobs', { params })
export const getJob = (id) => api.get(`/jobs/${id}`)
export const triggerScrape = () => api.get('/jobs/scrape') // Backend triggerScrape is a GET in jobs.py

// Profile
export const getProfile = () => api.get('/profile')
export const updateProfile = (data) => api.put('/profile', data)
export const uploadAvatar = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/profile/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Resumes
export const uploadResume = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/resume/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const getResumes = () => api.get('/resume/resumes')
export const deleteResume = (id) => api.delete(`/resume/${id}`)

// AI (v2.0)
export const analyzeMatch = (data) => api.post('/ai/match-score', data)
export const getSkillGap = (data) => api.post('/ai/skill-gap', data)
export const getSelectionProbability = (data) => api.post('/ai/selection-probability', data)
export const batchMatch = (data) => api.post('/ai/batch-match', data)
export const prepareAutofill = (data) => api.post('/ai/prepare-autofill', data)
export const smartApplyPrepare = (data) => api.post('/ai/smart-apply-prepare', data)

// Applications
export const applyToJob = (data) => api.post('/applications/apply', data)
export const submitApplication = (data) => api.post('/applications/apply', data)
export const getApplications = () => api.get('/applications')
export const updateApplicationStatus = (id, status) => api.patch(`/applications/${id}/status`, null, {
  params: { status }
})

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats')

export default api
