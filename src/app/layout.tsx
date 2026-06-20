import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Toaster } from "@/components/ui/sonner"
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants"
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  )
}