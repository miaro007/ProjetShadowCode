'use client'

import { useEffect, useState } from 'react'
import { User } from '@/types'
import { supabase } from '@/lib/supabase'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Récupérer l'utilisateur initial
    supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        if (error) {
          setError(error.message)
        } else {
          setUser(user as User)
        }
        setLoading(false)
      })

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user as User ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, error }
}