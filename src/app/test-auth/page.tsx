'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { User } from '@/types'

export default function TestAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user as User | null)
    })
  }, [])

  const handleSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      setMessage(`✅ Inscription réussie ! Vérifie tes emails : ${data.user?.email}`)
      setUser(data.user as User | null)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setMessage(`❌ Erreur : ${errorMessage}`)
    }
  }

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      setMessage(`✅ Connexion réussie ! ${data.user?.email}`)
      setUser(data.user as User | null)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setMessage(`❌ Erreur : ${errorMessage}`)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMessage('✅ Déconnecté')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔐 Test Authentification</h1>

        {user ? (
          <Card className="p-6 bg-green-50 border-green-200">
            <h2 className="text-xl font-semibold mb-4">✅ Connecté</h2>
            <p className="text-gray-700 mb-4">Email: {user.email}</p>
            <p className="text-gray-700 mb-4">ID: {user.id}</p>
            <Button onClick={handleSignOut} variant="destructive">
              Se déconnecter
            </Button>
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSignUp} className="flex-1">
                S&apos;inscrire
              </Button>
              <Button onClick={handleSignIn} variant="outline" className="flex-1">
                Se connecter
              </Button>
            </div>

            {message && (
              <p className={`text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}