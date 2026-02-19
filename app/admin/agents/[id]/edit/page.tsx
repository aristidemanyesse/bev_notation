"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentForm } from "@/components/admin/agent-form"
import { useAuth } from "@/lib/actions/auth-context"
import { Agent, Form, Role } from "@/lib/types/database"
import { api } from "@/lib/api/api"
import { useEffect, useState } from "react"

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const {user} = useAuth()
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])
  const [agent, setAgent] = useState<Agent | null>(null)

  
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.get<Role[]>("/api/roles/?is_active=true&ordering=-label")
        if (cancelled) return
        setRoles(r)
      } catch (e) {
        if (!cancelled) setLoading(false)
      }

      
      try {
        const {id} = await params
        const a = await api.get<Agent>("/api/agents/" + id)
        if (cancelled) return
        setAgent(a)
      } catch (e) {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [params])

  return (
    <DashboardShell role="ADMIN" user={user!}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Modifier un agent</h2>
          <p className="text-muted-foreground">Mettre à jour les informations de l'agent</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations de l'agent</CardTitle>
            <CardDescription>Modifiez les détails de l'agent</CardDescription>
          </CardHeader>
          <CardContent>
            <AgentForm roles={roles || []} agent={agent!} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
