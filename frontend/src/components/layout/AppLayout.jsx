import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import {
  Home, LayoutDashboard, User, Zap, LogOut,
  Briefcase, BarChart3, ClipboardList, Menu, X
} from 'lucide-react'

export default function AppLayout({ children }) {
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const topNavItems = [
    { path: '/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/match', icon: BarChart3, label: 'Match' },
    { path: '/tracker', icon: ClipboardList, label: 'Tracker' }
  ]

  const sideNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Profile' }
  ]

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col items-center w-[80px] bg-[#1C1A2E] py-6 shadow-2xl z-50 fixed inset-y-0 left-0">
        <Link to="/" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-10 shadow-lg shadow-purple-900/50 hover:scale-105 transition-transform no-underline">
          <Zap size={24} />
        </Link>
        <div className="flex flex-col gap-8 w-full items-center">
          {sideNavItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path
            return (
              <Link key={path} to={path} className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all cursor-pointer no-underline
                ${active ? 'bg-white text-purple-600 shadow-md' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
              `}>
                <Icon size={22} className={active ? '' : 'opacity-80 group-hover:opacity-100'} />
                {/* Tooltip */}
                <span className="absolute left-16 bg-gray-900 text-white text-xs font-bold px-2 py-1 flex items-center rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  {label}
                  <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -left-1 top-1/2 -translate-y-1/2 rounded-sm" />
                </span>
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-[80px] flex flex-col min-h-screen relative overflow-x-hidden">
        
        {/* Top Navbar */}
        <header className="h-[70px] bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 lg:px-8 z-40 sticky top-0">
          
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => setMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="hidden md:block text-xl font-bold text-gray-800 capitalize">
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">
              {topNavItems.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path
                return (
                  <Link key={path} to={path} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all no-underline ${active ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900 hover:bg-white/50'}`}>
                    {active && <Icon size={16} className="text-purple-600"/> }
                    {!active && <Icon size={16} className="text-gray-400"/> }
                    {label}
                  </Link>
                )
              })}
            </div>
            
            <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
            
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Modal */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} className="w-64 bg-white h-full relative z-10 shadow-2xl flex flex-col p-6">
               <div className="flex items-center justify-between mb-8">
                 <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 no-underline">
                   <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white"><Zap size={20}/></div>
                   <span className="font-bold text-xl text-gray-900">SmartApply AI</span>
                 </Link>
                 <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><X size={20}/></button>
               </div>
               
               <div className="flex flex-col gap-2 mb-8 border-b border-gray-100 pb-8">
                 {sideNavItems.map(({ path, icon: Icon, label }) => {
                    const active = location.pathname === path
                    return (
                      <Link key={path} to={path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl no-underline font-bold transition-all ${active ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Icon size={20} className={active ? "text-purple-600" : "text-gray-400"} /> {label}
                      </Link>
                    )
                 })}
               </div>
               
               <div className="flex flex-col gap-2">
                 {topNavItems.map(({ path, icon: Icon, label }) => {
                    const active = location.pathname === path
                    return (
                      <Link key={path} to={path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl no-underline font-bold transition-all ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Icon size={20} className={active ? "text-gray-900" : "text-gray-400"} /> {label}
                      </Link>
                    )
                 })}
               </div>
            </motion.aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 w-full relative">
          {children}
        </main>
      </div>
    </div>
  )
}
