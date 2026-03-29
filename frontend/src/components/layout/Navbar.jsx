import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, Briefcase, FileText, BarChart3,
  ClipboardList, LogOut, Menu, X, Zap
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/match', icon: BarChart3, label: 'Match' },
  { path: '/tracker', icon: ClipboardList, label: 'Tracker' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 no-underline">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Zap size={20} />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">SmartApply AI</span>
          </Link>

          {/* Desktop Nav */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {navItems.map(({ path, icon: Icon, label }) => {
                const active = location.pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all no-underline ${
                      active ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className={active ? "text-purple-600" : "text-gray-400"} />
                    {label}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <Link to="#" className="hover:text-purple-600 transition-colors">How it works</Link>
              <Link to="#" className="hover:text-purple-600 transition-colors">Pricing</Link>
              <Link to="#" className="hover:text-purple-600 transition-colors">About Us</Link>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-3 border-l border-gray-200 pl-4 ml-2">
                  <Link to="/profile" className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200 hover:bg-purple-200 hover:scale-105 transition-all outline-none">
                    {(user.full_name || user.email)?.[0]?.toUpperCase()}
                  </Link>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors font-medium">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/auth" className="text-gray-600 hover:text-gray-900 font-medium text-sm px-4 py-2">Log in</Link>
                <Link to="/auth?mode=signup" className="bg-[#EBE276] hover:bg-[#D9D05F] text-gray-900 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors">Register</Link>
              </div>
            )}
            {/* Mobile toggle */}
            <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-6 pt-2 flex flex-col gap-2 border-t border-gray-100"
          >
            {user ? navItems.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path
              return (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold no-underline ${
                      active ? 'bg-purple-50 text-purple-700' : 'text-gray-600'
                  }`}
                >
                  <Icon size={18} /> {label}
                </Link>
              )
            }) : (
               <div className="flex flex-col gap-4 p-4">
                 <Link to="/auth" className="w-full text-center py-3 text-gray-600 font-medium border border-gray-200 rounded-xl">Log in</Link>
                 <Link to="/auth?mode=signup" className="w-full text-center py-3 bg-[#EBE276] text-gray-900 font-bold rounded-xl">Register</Link>
               </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
