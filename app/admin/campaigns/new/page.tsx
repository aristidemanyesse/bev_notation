import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { CampaignCreationForm } from "@/components/admin/campaign-creation-form"
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

export default async function NewCampaignPage() {
  const user = await getCurrentUser()

  if (!user || user.role?.code !== "ADMIN") {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  const { data: questions } = await supabase.from("questions").select("*").eq("is_active", true).order("label")

  const { data: agents } = await supabase.from("agents").select("*").eq("is_active", true).order("last_name")

  return (
    <DashboardShell role="ADMIN" user={user}>
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Créer une nouvelle campagne</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Configurer une nouvelle campagne d'évaluation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails de la campagne</CardTitle>
            <CardDescription>Configurez les paramètres de votre campagne d'évaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormLoader />}>
              <CampaignCreationForm questions={questions || []} agents={agents || []} createdBy={user.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
