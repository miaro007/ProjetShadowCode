'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TestRow {
  id: number
  title: string
  created_at: string
}

export default function TestDatabase() {
  const [data, setData] = useState<TestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ Séparer la logique de fetch de setState
  const fetchData = useCallback(async () => {
    try {
      const { data: responseData, error: responseError } = await supabase
        .from('test_table')
        .select('*')
        .order('created_at', { ascending: false })

      if (responseError) throw responseError
      
      // ✅ setState dans un bloc séparé, pas directement dans l'effet
      setData(responseData || [])
      setError(null)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const addData = async () => {
    try {
      const { error } = await supabase
        .from('test_table')
        .insert([{ title: `Test ${new Date().toLocaleTimeString()}` }])

      if (error) throw error
      await fetchData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
    }
  }

  // ✅ Utiliser useEffect uniquement pour l'initialisation
  useEffect(() => {
    let isMounted = true
    
    const initialize = async () => {
      if (isMounted) {
        await fetchData()
      }
    }
    
    initialize()
    
    return () => {
      isMounted = false
    }
  }, [fetchData])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🗄️ Test Base de Données</h1>

        <div className="mb-4">
          <Button onClick={addData}>+ Ajouter une ligne</Button>
          <Button onClick={fetchData} variant="outline" className="ml-2">
            🔄 Rafraîchir
          </Button>
        </div>

        {loading && <p>Chargement...</p>}
        
        {error && (
          <Card className="p-4 bg-red-50 border-red-200 text-red-800">
            ❌ Erreur: {error}
          </Card>
        )}

        <div className="space-y-2">
          {data.map((row) => (
            <Card key={row.id} className="p-4">
              <div className="flex justify-between">
                <span className="font-semibold">{row.title}</span>
                <span className="text-sm text-gray-500">ID: {row.id}</span>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(row.created_at).toLocaleString('fr-FR')}
              </p>
            </Card>
          ))}
        </div>

        {data.length === 0 && !loading && (
          <Card className="p-4 text-center text-gray-500">
            Aucune donnée. Clique sur &quot;Ajouter une ligne&quot;
          </Card>
        )}
      </div>
    </div>
  )
}