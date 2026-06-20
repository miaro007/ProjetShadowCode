'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }

    checkSession()
  }, [router])

  return (
    <div className="h-screen flex items-center justify-center">
      Connexion en cours...
    </div>
  )
}