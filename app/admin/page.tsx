import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { AdminCampaignStats } from "@/lib/types/database"
import { AdminStatsCards } from "@/components/admin/admin-stats-cards"
import { CampaignsList } from "@/components/admin/campaigns-list"
import { CompletionChart } from "@/components/admin/completion-chart"

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role?.code !== "ADMIN") {
    redirect("/dashboard")
  }

  const supabase = await getSupabaseServerClient()

  // Get all campaign stats
  const { data: campaigns } = await supabase
    .from("admin_campaign_stats")
    .select("*")
    .order("period", { ascending: false })

  const activeCampaign = campaigns?.find((c) => c.period)

  // Calculate totals
  const totalAgents = activeCampaign?.total_agents || 0
  const totalExpected = campaigns?.reduce((sum, c) => sum + (c.total_expected_evaluations || 0), 0) || 0
  const totalCompleted = campaigns?.reduce((sum, c) => sum + (c.total_submitted_evaluations || 0), 0) || 0
  const overallCompletion = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0

  return (
    <DashboardShell role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Tableau de bord administrateur</h2>
            <p className="text-muted-foreground">Gérer les campagnes et surveiller la progression des évaluations</p>
          </div>
        </div>

        <AdminStatsCards
          totalAgents={totalAgents}
          totalCampaigns={campaigns?.length || 0}
          totalCompleted={totalCompleted}
          overallCompletion={overallCompletion}
        />

        {campaigns && campaigns.length > 0 && <CompletionChart campaigns={campaigns as AdminCampaignStats[]} />}

        {campaigns && campaigns.length > 0 && <CampaignsList campaigns={campaigns as AdminCampaignStats[]} />}
      </div>
    </DashboardShell>
  )
}
