// src/types/index.ts

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
}

// ✅ Remplacer 'any' par 'unknown' ou un type spécifique
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}