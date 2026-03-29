import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, FileText, Bot, BarChart3, ArrowRight, CheckCircle, Play } from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Smart Job Discovery',
    desc: 'Automatically discover internships and full-time roles tailored for you.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: FileText,
    title: 'Resume Match Score',
    desc: 'Upload your resume and get instant feedback on how well you match.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Skill Gap Analyzer',
    desc: 'Identify missing skills and access targeted resources to learn them.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Bot,
    title: 'One-Click Auto Apply',
    desc: 'Let automation handle the tedious form filling and submissions.',
    color: 'bg-orange-100 text-orange-600',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
            SmartApply AI 2.0
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-[1.1] text-gray-900 mb-6 tracking-tight">
            Keep scaling up your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">career</span> with ease.
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
            Help you maintain your application flow, discover opportunities, and apply seamlessly across the web with AI intelligence.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/auth?mode=signup" className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-purple-500/30">
              Start Now
            </Link>
            <button className="flex items-center gap-3 text-gray-700 font-medium hover:text-purple-600 transition-colors px-4 py-2">
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 text-purple-600">
                <Play size={18} className="ml-1" />
              </span>
              See how it works
            </button>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Free to start</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> No credit card</span>
          </div>
        </motion.div>

        {/* Hero Image/Graphic */}
        <motion.div
           initial={{ opacity: 0, x: 30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="relative"
        >
          {/* Main big card simulating the right side of the first image */}
          <div className="bg-purple-600 rounded-3xl p-8 pb-0 relative overflow-hidden shadow-2xl shadow-purple-900/20 md:h-[500px] flex justify-center items-end">
             {/* Decorative Elements */}
             <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
             <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
             
             {/* UI Mockup inside hero */}
             <div className="w-full max-w-sm bg-white rounded-t-2xl shadow-xl overflow-hidden translate-y-2 border border-gray-100/50">
                <div className="h-12 border-b border-gray-100 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto text-xs font-semibold text-gray-400">Dashboard</div>
                </div>
                <div className="p-6">
                   <div className="h-40 w-full bg-gray-100 rounded-xl mb-4 overflow-hidden relative">
                      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" alt="Professional" className="w-full h-full object-cover" />
                   </div>
                   <div className="text-center">
                     <h3 className="font-bold text-gray-900">Christine Bell</h3>
                     <p className="text-sm text-gray-500 mb-4">Software Engineer</p>
                     <div className="w-full h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700 font-semibold text-sm">
                       Match Score: 92%
                     </div>
                   </div>
                </div>
             </div>
             
             {/* Floating Badge */}
             <div className="absolute top-1/4 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-4 animate-[float_4s_ease-in-out_infinite]">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Growth</div>
                  <div className="font-bold text-gray-900">+45% Interviews</div>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-sm font-bold tracking-widest text-purple-600 uppercase mb-3">Our Features</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">What We Provide</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#FAFBFC] border border-gray-100 p-8 rounded-2xl hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform`}>
                  <feature.icon size={24} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{feature.desc}</p>
                <Link to="/auth" className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700">
                  Learn more <ArrowRight size={16} className="ml-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits / Two Column Section */}
      <section className="py-24 bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-indigo-100 rounded-[2rem] transform -rotate-3 scale-105"></div>
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000" 
                alt="Team working" 
                className="relative z-10 rounded-[2rem] shadow-2xl object-cover h-[400px] w-full"
              />
           </div>
           <div className="order-1 lg:order-2">
             <h2 className="text-sm font-bold tracking-widest text-purple-600 uppercase mb-3">Why Choose Us</h2>
             <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">Here are some of our benefits</h3>
             <p className="text-gray-600 mb-8 max-w-md">
               Join SmartApply and feel the difference in your application process. We streamline everything so you can focus on interviews.
             </p>
             <ul className="space-y-4 mb-10">
               {[
                 'Realtime tracking and analytics',
                 'Professional AI-driven insights',
                 'Automated application deployment'
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-3 text-gray-800 font-medium">
                   <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                     <CheckCircle size={14} />
                   </div>
                   {item}
                 </li>
               ))}
             </ul>
             <Link to="/auth?mode=signup" className="btn-primary">
               Get Started
             </Link>
           </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="bg-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/40 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            
            <h2 className="text-3xl font-bold mb-4 relative z-10">Subscribe to Our Newsletter</h2>
            <p className="text-purple-200 mb-8 max-w-lg mx-auto relative z-10">
              In case you're interested with our platform, we will let you stay up to date by sending latest updates.
            </p>
            
            <form className="max-w-md mx-auto relative z-10 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email here" 
                className="flex-1 py-3 px-5 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-bold text-xl text-purple-600 mb-4 tracking-tight">SmartApply AI</h3>
            <p className="text-gray-500 text-sm mb-6">SmartApply is an online platform used to find opportunities and auto-apply effortlessly.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-purple-600">Features</a></li>
              <li><a href="#" className="hover:text-purple-600">Pricing</a></li>
              <li><a href="#" className="hover:text-purple-600">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-purple-600">Blog</a></li>
              <li><a href="#" className="hover:text-purple-600">Help Center</a></li>
              <li><a href="#" className="hover:text-purple-600">Guides</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-purple-600">Terms of Service</a></li>
              <li><a href="#" className="hover:text-purple-600">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 pt-8 border-t border-gray-50 text-center text-sm text-gray-400">
          © 2025 SmartApply AI. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
