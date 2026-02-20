"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { redirect } from "next/navigation"

import { AgentForm } from "@/components/admin/agent-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense, use, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/actions/auth-context"
import { Role } from "@/lib/types/database"
import { api } from "@/lib/api/api"

function FormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function NewAgentPage() {
  const {user} = useAuth()
  const [roles , setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rs = await api.get<Role[]>("/api/roles/?is_active=true&ordering=-label")
        if (cancelled) return
        setRoles(rs)
      } catch (e) {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <DashboardShell role="ADMIN" user={user!}>
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Créer un nouvel agent</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Ajouter un nouvel agent au système</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations de l'agent</CardTitle>
            <CardDescription>Remplissez les détails de l'agent</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormLoader />}>
              <AgentForm roles={roles || []} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
