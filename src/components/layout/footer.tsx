import { APP_NAME } from '@/config/constants'

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-8 mt-auto">
      <div className="container mx-auto px-4 text-center text-gray-600">
        <p>&copy; 2024 {APP_NAME}. Tous droits réservés.</p>
      </div>
    </footer>
  )
}