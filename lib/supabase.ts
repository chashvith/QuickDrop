import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('[QuickDrop] Supabase env vars not set. Fill .env.local with your project URL and anon key.')
  }
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key')

export type Drop = {
  id: string
  user_id: string
  type: 'text' | 'file'
  content: string | null
  file_url: string | null
  file_name: string | null
  file_type: string | null
  created_at: string
  expires_at: string
}
