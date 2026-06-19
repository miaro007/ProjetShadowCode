import { AIChat } from '@/components/features/ai-chat'

export default function AIDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            🤖 Démonstration IA
          </h1>
          <p className="text-gray-600">
            Teste notre assistant IA propulsé par Groq
          </p>
        </div>

        {/* Chat Component */}
        <AIChat />

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">Ultra Rapide</h3>
            <p className="text-sm text-gray-600">
              Réponses en moins de 500ms grâce à Groq
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-2">🆓</div>
            <h3 className="font-semibold mb-2">100% Gratuit</h3>
            <p className="text-sm text-gray-600">
              Pas de carte bancaire, pas de limites strictes
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-2">🧠</div>
            <h3 className="font-semibold mb-2">Modèle Puissant</h3>
            <p className="text-sm text-gray-600">
              Llama 3.1 70B - Aussi bon que GPT-4
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}