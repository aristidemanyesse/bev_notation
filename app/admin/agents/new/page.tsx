import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { AgentForm } from "@/components/admin/agent-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

function FormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default async function NewAgentPage() {
  const user = await getCurrentUser()

  if (!user || user.role?.code !== "ADMIN") {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()
  const { data: roles } = await supabase.from("roles").select("*").order("label")

  return (
    <DashboardShell role="ADMIN" user={user}>
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
