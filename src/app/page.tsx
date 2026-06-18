import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ROUTES } from '@/config/constants'
import { Sparkles, Zap, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Bienvenue sur notre Projet
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            La solution innovante pour [résoudre votre problème]
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href={ROUTES.DASHBOARD}>Commencer maintenant</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">En savoir plus</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">
          Nos Fonctionnalités
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 hover:shadow-lg transition">
            <Sparkles className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Feature 1</h3>
            <p className="text-gray-600">
              Description de la première fonctionnalité incroyable
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition">
            <Zap className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Feature 2</h3>
            <p className="text-gray-600">
              Description de la deuxième fonctionnalité géniale
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition">
            <Shield className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Feature 3</h3>
            <p className="text-gray-600">
              Description de la troisième fonctionnalité puissante
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez des milliers d&apos;utilisateurs satisfaits
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href={ROUTES.REGISTER}>S&apos;inscrire gratuitement</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}