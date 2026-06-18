'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
  const [status, setStatus] = useState<{
    envUrl: string
    envKey: string
    connection: string
    message: string
  }>({
    envUrl: '...',
    envKey: '...',
    connection: '...',
    message: 'Test en cours...'
  })

  useEffect(() => {
    async function testConnection() {
      // 1. Vérifier les variables d'environnement
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NON DÉFINIE'
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? '✅ DÉFINIE (cachée)' 
        : '❌ NON DÉFINIE'

      // 2. Tester la connexion réelle
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus({
            envUrl: url,
            envKey: key,
            connection: '❌ ÉCHEC',
            message: `Erreur: ${error.message}`
          })
        } else {
          setStatus({
            envUrl: url,
            envKey: key,
            connection: '✅ SUCCÈS',
            message: 'Supabase est connecté et fonctionnel !'
          })
        }
      } catch (err) {
        setStatus({
          envUrl: url,
          envKey: key,
          connection: '❌ ÉCHEC',
          message: `Erreur inattendue: ${err}`
        })
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Test Supabase</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700">URL Supabase</h2>
            <p className={`text-lg ${status.envUrl.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
              {status.envUrl}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Clé API (Anon)</h2>
            <p className={`text-lg ${status.envKey.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {status.envKey}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Connexion</h2>
            <p className={`text-2xl font-bold ${status.connection.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {status.connection}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Message</h2>
            <p className="text-gray-600">{status.message}</p>
          </div>
        </div>

        {status.connection.includes('✅') && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold">
              🎉 Félicitations ! Supabase est correctement configuré !
            </p>
          </div>
        )}

        {status.connection.includes('❌') && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold mb-2">
              ⚠️ Problème détecté ! Vérifie :
            </p>
            <ul className="text-red-700 list-disc list-inside space-y-1">
              <li>Le fichier `.env.local` existe à la racine</li>
              <li>Les variables sont bien copiées depuis Supabase</li>
              <li>Tu as redémarré le serveur après modification</li>
              <li>Pas d&apos;espaces en trop dans les valeurs</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}