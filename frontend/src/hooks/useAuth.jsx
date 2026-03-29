import { useState, useEffect, useMemo, useCallback, useContext } from 'react'
import { login as apiLogin, signUp as apiSignUp, logout as apiLogout } from '@/services/api'
import { AuthContext } from './AuthContext'

// AuthContext moved to separate file for HMR stability

// 2. Named Export only for Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from local storage on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e)
        localStorage.removeItem('user_data')
        localStorage.removeItem('access_token')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const res = await apiLogin({ email, password })
      const { access_token, user_id, email: userEmail, full_name } = res.data
      
      if (!access_token) {
        throw new Error("No access token received from server")
      }

      const userData = { id: user_id, email: userEmail, full_name }
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user_data', JSON.stringify(userData))
      setUser(userData)
      return userData
    } catch (error) {
      console.error("Login failed", error)
      throw error
    }
  }, [])

  const signUp = useCallback(async (email, password, full_name) => {
    try {
      const res = await apiSignUp({ email, password, full_name })
      return res.data
    } catch (error) {
      console.error("Signup failed", error)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch (e) {
      console.warn("Logout API call failed", e)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_data')
      setUser(null)
    }
  }, [])

  const updateUserData = useCallback((newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData }
      localStorage.setItem('user_data', JSON.stringify(updated))
      return updated
    })
  }, [])

  // 3. Stable value object using useMemo
  const value = useMemo(() => ({
    user,
    loading,
    login,
    signUp,
    logout,
    updateUserData
  }), [user, loading, login, signUp, logout, updateUserData])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 4. Custom Hook as Named Export
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
