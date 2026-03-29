import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration in .env. Variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.")
}

export const supabase = createClient(supabaseUrl || 'http://localhost:8000', supabaseAnonKey || 'dummy_key')

// Subscribe to real-time application updates
export const subscribeToApplications = (userId, callback) => {
  return supabase
    .channel('public:applications')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()
}

export default supabase
