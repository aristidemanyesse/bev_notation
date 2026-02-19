"use client"

import { Loader2 } from "lucide-react"

type PageLoadingProps = {
  title?: string
  description?: string
}

export function PageLoading({
  title = "Chargement…",
  description = "Nous préparons vos données.",
}: PageLoadingProps) {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border bg-muted flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold leading-none">{title}</p>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-3 w-3/4 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-5/6 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
