'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { APP_NAME, ROUTES } from '@/config/constants'
import { useUser } from '@/hooks/useUser'
import { signOut } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const { user, loading } = useUser()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push(ROUTES.HOME)
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={ROUTES.HOME} className="text-2xl font-bold">
          {APP_NAME}
        </Link>
        
        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href={ROUTES.DASHBOARD}>Dashboard</Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Se déconnecter
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href={ROUTES.LOGIN}>Se connecter</Link>
                  </Button>
                  <Button asChild>
                    <Link href={ROUTES.REGISTER}>Sinscrire</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}