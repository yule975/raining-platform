import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 类型定义
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'student' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'admin'
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'admin'
          updated_at?: string
        }
      }
      authorized_users: {
        Row: {
          id: number
          email: string
          name: string | null
          added_at: string
          status: string
        }
        Insert: {
          email: string
          name?: string | null
          status?: string
        }
        Update: {
          email?: string
          name?: string | null
          status?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_url: string | null
          video_url: string | null
          duration: string | null
          instructor: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description?: string | null
          cover_url?: string | null
          video_url?: string | null
          duration?: string | null
          instructor?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          cover_url?: string | null
          video_url?: string | null
          duration?: string | null
          instructor?: string | null
          updated_at?: string
        }
      }
    }
  }
}
