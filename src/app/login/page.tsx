'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Turnstile from 'react-turnstile'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 🔎 VERIFY CAPTCHA
  const verifyCaptcha = async () => {
    const res = await fetch('/api/verify-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: captchaToken }),
    })

    return res.json()
  }

  // 🔐 LOGIN
  const handleLogin = async () => {
    try {
      setLoading(true)
      setMessage('')

      if (!email || !password) {
        setMessage('Remplis tous les champs')
        return
      }

      if (!captchaToken) {
        setMessage('Valide le captcha')
        return
      }

      const captcha = await verifyCaptcha()

      if (!captcha.success) {
        setMessage('Captcha invalide')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
        return
      }

      router.push('/dashboard')
    } catch {
      setMessage('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  // 🧾 SIGN UP
  const handleSignup = async () => {
    try {
      setLoading(true)
      setMessage('')

      if (!email || !password) {
        setMessage('Remplis tous les champs')
        return
      }

      if (!captchaToken) {
        setMessage('Valide le captcha')
        return
      }

      const captcha = await verifyCaptcha()

      if (!captcha.success) {
        setMessage('Captcha invalide')
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
        return
      }

      setMessage('Vérifie ton email 📩')
    } catch {
      setMessage('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

      <Card className="w-full max-w-md p-6 space-y-4">

        <h1 className="text-2xl font-bold text-center">
          🔐 Connexion
        </h1>

        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* CAPTCHA */}
        <div className="flex justify-center">
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onVerify={(token) => setCaptchaToken(token)}
          />
        </div>

        <Button onClick={handleLogin} className="w-full">
          Se connecter
        </Button>

        <Button
          onClick={handleSignup}
          variant="secondary"
          className="w-full"
        >
          Créer un compte
        </Button>

        {message && (
          <p className="text-center text-sm text-red-500">
            {message}
          </p>
        )}

      </Card>
    </div>
  )
}