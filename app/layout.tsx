import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { PageTransition } from "@/components/layout/page-transition"
import "./globals.css"
import { AuthProvider } from "@/lib/actions/auth-context"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Plateforme de notation - BEV",
  description: "Plateforme de notation des agents",
  generator: "RSTD",
  icons: {
    icon: [
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <PageTransition />
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
