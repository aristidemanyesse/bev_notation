import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect, notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { AgentPerformanceTable } from "@/components/admin/agent-performance-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CampaignStatusToggle } from "@/components/admin/campaign-status-toggle"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import { Loader2, Edit } from "lucide-react"
import Link from "next/link"

function CampaignLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

interface PageParams {
  id: string
}

export default async function CampaignDetailsPage({ params }: { params: PageParams | Promise<PageParams> }) {
  const { id } = await params

  const user = await getCurrentUser()

  if (!user || user.role?.code !== "ADMIN") {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  const { data: campaign } = await supabase.from("admin_campaign_stats").select("*").eq("form_id", id).maybeSingle()

  const { data: form } = await supabase.from("forms").select("*").eq("id", id).maybeSingle()

  const { data: agentStats } = await supabase
    .from("admin_campaign_agent_stats")
    .select("*")
    .eq("form_id", id)
    .order("global_score", { ascending: false })

  if (!campaign || !form) {
    throw new Error("Campaign or Form not found")
  }

  const completionRate = campaign.completion_rate || 0

  return (
    <DashboardShell role="ADMIN" user={user}>
      <Suspense fallback={<CampaignLoader />}>
        <div className="space-y-6 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{campaign.title}</h2>
                <Badge variant={completionRate >= 75 ? "default" : "secondary"}>{campaign.period}</Badge>
                <Badge variant={form.is_active ? "default" : "outline"}>{form.is_active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                Analyses détaillées du trimestre et performances des agents
              </p>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/campaigns/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <CampaignStatusToggle formId={id} isActive={form.is_active} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.total_agents}</div>
                <p className="text-xs text-muted-foreground">Participant à cette notation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Notations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaign.total_submitted_evaluations} / {campaign.total_expected_evaluations}
                </div>
                <p className="text-xs text-muted-foreground">Nombre de collègues notés</p>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
                <Progress value={completionRate} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {agentStats && <AgentPerformanceTable agents={agentStats} />}
        </div>
      </Suspense>
    </DashboardShell>
  )
}
