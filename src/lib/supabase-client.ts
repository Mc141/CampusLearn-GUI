import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    'https://tfkmdenynqoydcmgydse.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma21kZW55bnFveWRjbWd5ZHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDkwMDAsImV4cCI6MjA3NTc4NTAwMH0.pn-aVKm86_2mscxldeZkxf7eHfLmlDa8l4bUDyeGLwo'
  )
}
