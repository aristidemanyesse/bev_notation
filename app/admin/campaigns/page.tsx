import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { AdminCampaignStats } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye, Loader2 } from "lucide-react"
import { Suspense } from "react"

function CampaignsLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

async function CampaignsList() {
  const supabase = await getSupabaseServerClient()

  const { data: campaigns } = await supabase
    .from("admin_campaign_stats")
    .select("*")
    .order("period", { ascending: false })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tous les trimestres</CardTitle>
        <CardDescription>Liste complète des notations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns && campaigns.length > 0 ? (
            campaigns.map((campaign: AdminCampaignStats) => {
              const completionRate = campaign.completion_rate || 0

              return (
                <div
                  key={campaign.form_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{campaign.title}</h3>
                      <Badge variant={completionRate >= 75 ? "default" : "secondary"}>
                        {completionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.period} • {campaign.total_agents} agents • {campaign.total_submitted_evaluations} /{" "}
                      {campaign.total_expected_evaluations} agents notés
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                    <Link href={`/admin/campaigns/${campaign.form_id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </Link>
                  </Button>
                </div>
              )
            })
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune campagne trouvée. Créez votre première campagne.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function CampaignsPage() {
  const user = await getCurrentUser()

  if (!user || user.role?.code !== "ADMIN") {
    redirect("/login")
  }

  return (
    <DashboardShell role="ADMIN" user={user}>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Trimestres</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Gérer les notations et suivre la progression
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau trimestre
            </Link>
          </Button>
        </div>

        <Suspense fallback={<CampaignsLoader />}>
          <CampaignsList />
        </Suspense>
      </div>
    </DashboardShell>
  )
}
