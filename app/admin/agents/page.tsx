import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { AgentActions } from "@/components/admin/agent-actions"

export default async function AgentsPage() {
  const user = await getCurrentUser()

  if (!user || user.role?.code !== "ADMIN") {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  const { data: agents } = await supabase
    .from("agents")
    .select("*, role:roles(*)")
    .order("last_name", { ascending: true })

  return (
    <DashboardShell role="ADMIN">
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
