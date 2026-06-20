import type { Metadata } from "next"
import { Poppins, Geist } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants"
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800', '900']
})

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={cn("font-sans", geist.variable)}>
      <body className={poppins.className}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}