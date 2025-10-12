import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tfkmdenynqoydcmgydse.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma21kZW55bnFveWRjbWd5ZHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDkwMDAsImV4cCI6MjA3NTc4NTAwMH0.pn-aVKm86_2mscxldeZkxf7eHfLmlDa8l4bUDyeGLwo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
