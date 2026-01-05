import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { AgentCategoryScore, Form } from "@/lib/types/database"
import { CategoryScoresChart } from "@/components/dashboard/category-scores-chart"
import { EvaluationsList } from "@/components/dashboard/evaluations-list"
import { CampaignHistory } from "@/components/dashboard/campaign-history"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, FileText, CheckCircle2, TrendingUp, Plus, Link, Eye } from "lucide-react"
import { EvaluationsGivenTable } from "@/components/dashboard/evaluations-given-table"
import { EvaluationsReceivedTable } from "@/components/dashboard/evaluations-received-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select"
import { CampaignSelect } from "@/components/dashboard/campaign-select"

export default async function NoterPage({searchParams}: {searchParams: Promise<{ campaignId?: string }>}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }
  const supabase = await getSupabaseServerClient()

    // Get active campaigns (pour le select)

const { data: activeCampaigns } = await supabase
  .from("forms")
  .select("id, title, period, created_at")
  .eq("is_active", true)
  .order("created_at", { ascending: false })

const campaigns = activeCampaigns ?? []

const resolvedSearchParams = await searchParams
const selectedCampaignId =
  resolvedSearchParams.campaignId ?? campaigns[0]?.id

const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)

const { data: summary } = await supabase
  .from("agent_dashboard_summary")
  .select("*")
  .eq("agent_id", user.id)
  .eq("form_id", selectedCampaignId)
  .maybeSingle()


  const { data: categoryScores } = await supabase
  .from("agent_category_scores")
  .select("*")
  .eq("agent_id", user.id)
  .eq("form_id", selectedCampaignId)


  const { data: pendingEvaluations } = await supabase
  .from("agent_pending_evaluations")
  .select(`
    *,
    evaluated:agents!evaluations_evaluated_id_fkey(
      matricule,
      first_name,
      last_name
    )
  `)
  .eq("evaluator_id", user.id)
  .eq("form_id", selectedCampaignId)
  .order("form_created_at", { ascending: true })


  const { data: evaluationsGiven } = await supabase
  .from("evaluations")
  .select(`
    *,
    evaluated:agents!evaluations_evaluated_id_fkey(matricule, first_name, last_name),
    form:forms(title, period)
  `)
  .eq("evaluator_id", user.id)
  .eq("form_id", selectedCampaignId)
  .not("submitted_at", "is", null)
  .order("submitted_at", { ascending: false })


  const { data: evaluationsReceived } = await supabase
  .from("evaluations")
  .select(`
    *,
    evaluator:agents!evaluations_evaluator_id_fkey(matricule, first_name, last_name),
    form:forms(title, period)
  `)
  .eq("evaluated_id", user.id)
  .eq("form_id", selectedCampaignId)
  .not("submitted_at", "is", null)
  .order("submitted_at", { ascending: false })


  const totalEvaluationsReceived = summary?.evaluations_received || 0
  const totalEvaluationsDone = summary?.evaluations_done || 0
  const expectedEvaluations = pendingEvaluations?.length || 0
  const completionRate =
    expectedEvaluations > 0
      ? Math.round((totalEvaluationsDone / (totalEvaluationsDone + expectedEvaluations)) * 100)
      : 100

  return (
    <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"} user={user}>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Noter un collègue </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedCampaign
                ? selectedCampaign.title + " - " + selectedCampaign.period
                : "Aucune campagne active"}
            </p>
          </div>
          <CampaignSelect
            campaigns = {activeCampaigns}
            selectedCampaignId={selectedCampaignId}
            path = "/dashboard/noter?campaignId="
          />
        </div>
        <p className="h-5"> </p>


        {pendingEvaluations && pendingEvaluations.length > 0 ? (
          <EvaluationsList evaluations={pendingEvaluations} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
            <Eye className="h-6 w-6 opacity-50" />
            <p className="text-sm">
              Aucune notation en attente pour ce trimestre.
            </p>
          </div>
        )}


        <div className="grid gap-6">
          {evaluationsGiven && evaluationsGiven.length > 0 ? (
            <EvaluationsGivenTable evaluations={evaluationsGiven} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
              <Eye className="h-6 w-6 opacity-50" />
              <p className="text-sm">
                Vous n’avez encore soumis aucune notation pour ce trimestre.
              </p>
            </div>
          )}
        </div>


      </div>
    </DashboardShell>
  )
}
