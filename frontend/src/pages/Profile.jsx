import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { 
  User, Mail, MapPin, Link as LinkIcon, Briefcase, Phone, Save, 
  Loader2, Camera, Github, Linkedin, Globe, FileText, Trash2, 
  Plus, X, Bell, Shield, CheckCircle2, AlertCircle, ChevronRight,
  TrendingUp, GraduationCap, Building2, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '@/services/api'

export default function Profile() {
  const { user, updateUserData } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const resumeInputRef = useRef(null)

  const [profile, setProfile] = useState({
    full_name: '',
    target_role: '',
    phone: '',
    location: '',
    education: '',
    experience: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    bio: '',
    skills: [],
    preferences: {
      remote_preference: false,
      notifications_enabled: true
    },
    avatar_url: ''
  })

  const [resumes, setResumes] = useState([])
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const [profileRes, resumesRes] = await Promise.all([
        api.getProfile(),
        api.getResumes()
      ])
      setProfile(profileRes.data)
      setResumes(resumesRes.data.resumes || [])
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setProfile(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }))
    } else {
      setProfile(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleTogglePreference = (key) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await api.updateProfile(profile)
      setProfile(res.data)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
      // Optionally update auth context if name changed
      if (updateUserData) updateUserData({ full_name: res.data.full_name })
    } catch (error) {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }

    try {
      setUploading(true)
      const res = await api.uploadAvatar(file)
      setProfile(prev => ({ ...prev, avatar_url: res.data.avatar_url }))
      toast.success('Avatar updated successfully!')
    } catch (error) {
      toast.error('Failed to upload avatar.')
    } finally {
      setUploading(false)
    }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.filename && !file.name.endsWith('.pdf')) {
        toast.error('Please upload a PDF file.')
        return
    }

    try {
      setUploading(true)
      await api.uploadResume(file)
      toast.success('Resume uploaded successfully!')
      // Refresh list
      const res = await api.getResumes()
      setResumes(res.data.resumes || [])
    } catch (error) {
      toast.error('Failed to upload resume.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return
    try {
      await api.deleteResume(id)
      setResumes(prev => prev.filter(r => r.id !== id))
      toast.success('Resume deleted.')
    } catch (error) {
      toast.error('Failed to delete resume.')
    }
  }

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault()
      if (profile.skills.includes(newSkill.trim())) {
        toast.error('Skill already added.')
        return
      }
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }))
  }

  const calculateProgress = () => {
    const fields = [
      profile.full_name, profile.target_role, profile.phone, profile.location,
      profile.education, profile.experience, profile.linkedin_url, profile.bio,
      profile.skills.length > 0, resumes.length > 0
    ]
    const filled = fields.filter(Boolean).length
    return (filled / fields.length) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const progress = calculateProgress()

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT PANEL (30%) */}
          <div className="lg:w-[320px] shrink-0">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 sticky top-24"
            >
              <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-500 p-1">
                  <div className="w-full h-full rounded-[20px] bg-white overflow-hidden flex items-center justify-center relative">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-gray-200" />
                    )}
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-lg flex items-center justify-center text-gray-500 hover:text-purple-600 hover:scale-110 transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                </button>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900">{profile.full_name || 'Anonymous User'}</h2>
                <p className="text-sm font-bold text-purple-600 mt-1">{profile.target_role || 'No Role Set'}</p>
                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400 font-bold">
                  <MapPin size={12} /> {profile.location || 'Remote'}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <Mail size={16} className="text-gray-400" /> {profile.email || user?.email}
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <Phone size={16} className="text-gray-400" /> {profile.phone}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-gray-400">Profile Completion</span>
                  <span className="text-xs font-bold text-purple-600">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" 
                  />
                </div>
              </div>

              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`w-full mt-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isEditing 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-indigo-950 text-white shadow-lg shadow-indigo-900/20 hover:scale-[1.02]'
                }`}
              >
                {isEditing ? <X size={18} /> : <FileText size={18} />}
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
            </motion.div>
          </div>

          {/* RIGHT PANEL (70%) */}
          <div className="flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col"
            >
              {/* TABS HEADER */}
              <div className="flex border-b border-gray-100 p-2 gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'personal', label: 'Personal Info', icon: User },
                  { id: 'resume', label: 'Resume Manager', icon: FileText },
                  { id: 'skills', label: 'Skills Manager', icon: Layers },
                  { id: 'settings', label: 'Preferences', icon: Shield }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all shrink-0 ${
                      activeTab === tab.id 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              <div className="p-8 flex-1">
                <AnimatePresence mode="wait">
                  {activeTab === 'personal' && (
                    <motion.div
                      key="personal"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                          <p className="text-sm text-gray-400 font-medium">Basic details for your applications.</p>
                        </div>
                        {!isEditing && (
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="text-sm font-bold text-purple-600 hover:underline"
                          >
                            Edit Fields
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <ProfileField 
                          label="Full Name" 
                          name="full_name" 
                          val={profile.full_name} 
                          edit={isEditing} 
                          onChange={handleInputChange} 
                          icon={User}
                        />
                        <ProfileField 
                          label="Target Role" 
                          name="target_role" 
                          val={profile.target_role} 
                          edit={isEditing} 
                          onChange={handleInputChange} 
                          icon={TrendingUp}
                          placeholder="e.g. Frontend Engineer"
                        />
                        <ProfileField 
                          label="Phone Number" 
                          name="phone" 
                          val={profile.phone} 
                          edit={isEditing} 
                          onChange={handleInputChange} 
                          icon={Phone}
                        />
                        <ProfileField 
                          label="Location" 
                          name="location" 
                          val={profile.location} 
                          edit={isEditing} 
                          onChange={handleInputChange} 
                          icon={MapPin}
                        />
                        <ProfileField 
                          label="Education" 
                          name="education" 
                          val={profile.education} 
                          edit={isEditing} 
                          onChange={handleInputChange} 
                          icon={GraduationCap}
                          placeholder="e.g. B.Tech in Computer Science"
                        />
                        <ProfileField 
                          label="Experience" 
                          name="experience" 
                          val={profile.experience} 
                          edit={isEditing} 
                          onChange={handleInputChange} 
                          icon={Building2}
                          placeholder="e.g. 2 years at TechCorp"
                        />
                        <ProfileField 
                          label="LinkedIn" 
                          name="linkedin_url" 
                          val={profile.linkedin_url} 
                          edit={isEditing} 
                          onChange={handleInputChange} 
                          icon={Linkedin}
                        />
                        <ProfileField 
                          label="GitHub" 
                          name="github_url" 
                          val={profile.github_url} 
                          edit={isEditing} 
                          onChange={handleInputChange} 
                          icon={Github}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          Professional Bio
                        </label>
                        {isEditing ? (
                          <textarea
                            name="bio"
                            value={profile.bio}
                            onChange={handleInputChange}
                            className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 transition-all outline-none min-h-[120px] text-sm font-medium"
                          />
                        ) : (
                          <div className="p-4 rounded-2xl bg-gray-50 text-sm font-medium text-gray-700 min-h-[80px]">
                            {profile.bio || <span className="italic text-gray-400">No bio added yet. Tell us about yourself!</span>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'resume' && (
                    <motion.div
                      key="resume"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Resume Manager</h3>
                        <p className="text-sm text-gray-400 font-medium">Upload and manage your CVs for job applications.</p>
                      </div>

                      <div 
                        onClick={() => resumeInputRef.current.click()}
                        className="group border-[1.5px] border-dashed border-purple-200 rounded-[32px] p-12 text-center hover:bg-purple-50/50 hover:border-purple-400 cursor-pointer transition-all duration-300"
                      >
                        <input type="file" ref={resumeInputRef} onChange={handleResumeUpload} accept=".pdf" className="hidden" />
                        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          {uploading ? <Loader2 className="animate-spin" /> : <Plus size={32} />}
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          {uploading ? 'Processing Resume...' : 'Click to upload your resume'}
                        </p>
                        <p className="text-xs font-bold text-gray-400 mt-1">PDF only. Max size 5MB.</p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 pl-2">
                           My Resumes <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-500">{resumes.length}</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {resumes.length > 0 ? (
                            resumes.map(resume => (
                              <div key={resume.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-3xl group hover:shadow-lg hover:shadow-purple-500/5 transition-all">
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-white flex items-center justify-center shrink-0">
                                    <FileText size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-sm font-bold text-gray-900 truncate pr-2">{resume.filename}</h5>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                      Uploaded on {new Date(resume.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a 
                                    href={resume.file_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                  >
                                    <LinkIcon size={18} />
                                  </a>
                                  <button 
                                    onClick={() => handleDeleteResume(resume.id)}
                                    className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-400 font-bold">No resumes uploaded yet.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'skills' && (
                    <motion.div
                      key="skills"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Skills Manager</h3>
                          <p className="text-sm text-gray-400 font-medium">Highlight your core competencies.</p>
                        </div>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-50 text-purple-600 text-[13px] font-bold hover:bg-purple-100 transition-colors">
                          <TrendingUp size={16} />
                          AI Suggest Skills
                        </button>
                      </div>

                      <div className="bg-[#F8FAFC] rounded-[32px] p-8 border border-gray-100">
                        <div className="flex gap-4 mb-8">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder="Add a skill (e.g. React, Python, UI Design)"
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              onKeyDown={handleAddSkill}
                              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-100 focus:border-purple-400 outline-none font-bold text-sm shadow-sm transition-all"
                            />
                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {profile.skills.length > 0 ? (
                            profile.skills.map((skill, idx) => (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={idx}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm text-sm font-bold text-gray-700 hover:border-purple-200 hover:text-purple-600 transition-all cursor-default"
                              >
                                {skill}
                                <button
                                  onClick={() => removeSkill(skill)}
                                  className="text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center w-full py-4 space-y-2">
                                <AlertCircle className="mx-auto text-gray-200" size={32} />
                                <p className="text-xs font-bold text-gray-400">Typer and press Enter to add skills.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-indigo-950 text-white flex items-center justify-between shadow-xl shadow-indigo-950/20">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                             <TrendingUp className="text-white" size={24} />
                           </div>
                           <div>
                             <h4 className="font-bold text-sm">Skill Matching Insights</h4>
                             <p className="text-[10px] uppercase font-black text-indigo-300 tracking-widest">Available with Pro Plan</p>
                           </div>
                         </div>
                         <button className="px-6 py-2.5 rounded-xl bg-white text-indigo-950 text-xs font-bold hover:scale-105 transition-transform">Learn More</button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Preferences & Settings</h3>
                        <p className="text-sm text-gray-400 font-medium">Customize your application behavior.</p>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 bg-white rounded-[24px] border border-gray-100 flex items-center justify-between hover:border-purple-200 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Globe size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">Remote Preference</h4>
                              <p className="text-xs text-gray-400 font-bold">Only auto-apply to remote opportunities.</p>
                            </div>
                          </div>
                          <Toggle 
                            enabled={profile.preferences.remote_preference} 
                            onToggle={() => handleTogglePreference('remote_preference')} 
                          />
                        </div>

                        <div className="p-6 bg-white rounded-[24px] border border-gray-100 flex items-center justify-between hover:border-purple-200 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                              <Bell size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">Browser Notifications</h4>
                              <p className="text-xs text-gray-400 font-bold">Get alerts when auto-apply succeeds.</p>
                            </div>
                          </div>
                          <Toggle 
                            enabled={profile.preferences.notifications_enabled} 
                            onToggle={() => handleTogglePreference('notifications_enabled')} 
                          />
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                           <h4 className="text-sm font-bold text-red-600 mb-4 px-2">Danger Zone</h4>
                           <button className="w-full p-6 text-left border border-red-100 rounded-[24px] bg-red-50/30 flex items-center justify-between hover:bg-red-50 group">
                              <div>
                                <h5 className="font-bold text-red-600">Delete Account</h5>
                                <p className="text-[11px] font-bold text-red-400">Permanently remove all your data and applications.</p>
                              </div>
                              <ChevronRight className="text-red-300 group-hover:translate-x-1 transition-transform" size={20} />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SAVE ACTION FOOTER */}
              {isEditing && (
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3 px-8">
                  <button 
                    onClick={() => {
                        setIsEditing(false);
                        fetchProfileData(); // Reset data
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleSave}
                    className="btn-primary py-2.5 px-8 shadow-xl shadow-purple-600/20 flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Save Changes
                  </button>
                </div>
              )}
            </motion.div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

function ProfileField({ label, name, val, edit, onChange, icon: Icon, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Icon size={12} /> {label}
      </label>
      {edit ? (
        <input
          type="text"
          name={name}
          value={val || ''}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 transition-all outline-none font-bold text-sm"
        />
      ) : (
        <div className="px-4 py-3.5 rounded-2xl bg-gray-50/50 text-sm font-bold text-gray-900 border border-transparent">
          {val || <span className="italic text-gray-300 font-normal">Not set</span>}
        </div>
      )}
    </div>
  )
}

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 outline-none ${
        enabled ? 'bg-purple-600' : 'bg-gray-200'
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
