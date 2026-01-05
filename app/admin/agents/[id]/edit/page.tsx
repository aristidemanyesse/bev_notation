import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentForm } from "@/components/admin/agent-form"

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.role?.code !== "ADMIN") {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  const { data: roles } = await supabase.from("roles").select("*").order("label")

  const { data: agent } = await supabase.from("agents").select("*, role:roles(*)").eq("id", id).single()

  if (!agent) {
    redirect("/admin/agents")
  }

  return (
    <DashboardShell role="ADMIN" user={user}>
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
            <AgentForm roles={roles || []} agent={agent} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
