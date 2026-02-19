"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { AgentActions } from "@/components/admin/agent-actions"
import { useAuth } from "@/lib/actions/auth-context"
import { useEffect, useState } from "react"
import { Agent } from "@/lib/types/database"
import { api } from "@/lib/api/api"

export default function AgentsPage() {
  const {user} = useAuth()
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const datas = await api.get<Agent[]>("/api/agents/?is_active=true&ordering=-last_name")
        if (cancelled) return

        setAgents(datas)
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Agents</h2>
            <p className="text-muted-foreground">Gérer les agents et voir leurs informations</p>
          </div>
          <Button asChild>
            <Link href="/admin/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvel agent
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tous les agents</CardTitle>
            <CardDescription>Liste de tous les agents du système</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents && agents.length > 0 ? (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        {agent.first_name[0]}
                        {agent.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium">
                          {agent.first_name} {agent.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">Matricule: {agent.matricule}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.role?.code === "ADMIN" ? "default" : "secondary"}>
                        {agent.role?.label}
                      </Badge>
                      <Badge variant={agent.is_active ? "default" : "outline"}>
                        {agent.is_active ? "Actif" : "Inactif"}
                      </Badge>
                      <AgentActions agent={agent} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucun agent trouvé.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
