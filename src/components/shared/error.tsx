import { AlertCircle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  title?: string
}

export function ErrorMessage({ message, title = "Erreur" }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}