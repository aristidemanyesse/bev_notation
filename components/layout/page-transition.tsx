"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export function PageTransition() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const [prevPath, setPrevPath] = useState<string | null>(null)

  useEffect(() => {
    if (prevPath && prevPath !== pathname) {
      // déclenche le loader uniquement si le path change
      setIsLoading(true)
      const timeout = setTimeout(() => setIsLoading(false), 500)
      return () => clearTimeout(timeout)
    }
    setPrevPath(pathname)
  }, [pathname, prevPath])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  )
}
