'use client'

import { useUser } from '@/hooks/useUser'
import { Loading } from '@/components/shared/loading'
import { ErrorMessage } from '@/components/shared/error'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/config/constants'
import { useEffect } from 'react'

export default function Dashboard() {
  const { user, loading, error } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(ROUTES.LOGIN)
    }
  }, [user, loading, router])

  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} />
  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Bienvenue, {user.email}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Statistique 1</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-gray-600 mt-2">Description</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Statistique 2</h3>
          <p className="text-3xl font-bold text-indigo-600">0</p>
          <p className="text-sm text-gray-600 mt-2">Description</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Statistique 3</h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
          <p className="text-sm text-gray-600 mt-2">Description</p>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Contenu à venir</h2>
          <p className="text-gray-600 mb-4">
            Cette section sera développée pendant le hackathon
          </p>
          <Button>Action principale</Button>
        </Card>
      </div>
    </div>
  )
}