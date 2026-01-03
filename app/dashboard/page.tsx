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
import { Users, FileText, CheckCircle2, TrendingUp } from "lucide-react"
import { EvaluationsGivenTable } from "@/components/dashboard/evaluations-given-table"
import { EvaluationsReceivedTable } from "@/components/dashboard/evaluations-received-table"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role?.code !== "AGENT") {
    redirect("/admin")
  }

  const supabase = await getSupabaseServerClient()

  // Get active form
const { data: activeForm } = await supabase
  .from("forms")
  .select("*")
  .eq("is_active", true)
  .order("created_at", { ascending: false }) // ou "period" si tu préfères
  .limit(1)
  .maybeSingle()

  
  // Get dashboard summary
  const { data: summary } = await supabase
    .from("agent_dashboard_summary")
    .select("*")
    .eq("agent_id", user.id)
    .eq("form_id", activeForm?.id)
    .single()

  // Get category scores
  const { data: categoryScores } = await supabase
    .from("agent_category_scores")
    .select("*")
    .eq("agent_id", user.id)
    .eq("form_id", activeForm?.id)

  // Get pending evaluations
  const { data: pendingEvaluations } = await supabase
    .from("evaluations")
    .select(
      `
      *,
      evaluated:agents!evaluations_evaluated_id_fkey(matricule, first_name, last_name),
      form:forms(title, period)
    `,
    )
    .eq("evaluator_id", user.id)
    .eq("form_id", activeForm?.id)
    .is("submitted_at", null)

  const { data: evaluationsGiven } = await supabase
    .from("evaluations")
    .select(
      `
      *,
      evaluated:agents!evaluations_evaluated_id_fkey(matricule, first_name, last_name),
      form:forms(title, period)
    `,
    )
    .eq("evaluator_id", user.id)
    .eq("form_id", activeForm?.id)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })

  const { data: evaluationsReceived } = await supabase
    .from("evaluations")
    .select(
      `
      *,
      evaluator:agents!evaluations_evaluator_id_fkey(matricule, first_name, last_name),
      form:forms(title, period)
    `,
    )
    .eq("evaluated_id", user.id)
    .eq("form_id", activeForm?.id)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })

  // Get past campaigns
  const { data: pastCampaigns } = await supabase
    .from("forms")
    .select("*")
    .eq("is_active", false)
    .order("period", { ascending: false })
    .limit(5)

  const totalEvaluationsReceived = summary?.evaluations_received || 0
  const totalEvaluationsDone = summary?.evaluations_done || 0
  const expectedEvaluations = pendingEvaluations?.length || 0
  const completionRate =
    expectedEvaluations > 0
      ? Math.round((totalEvaluationsDone / (totalEvaluationsDone + expectedEvaluations)) * 100)
      : 100


    console.log("activeForm:", activeForm)
console.log("summary:", summary)
console.log("categoryScores:", categoryScores)
console.log("pendingEvaluations:", pendingEvaluations)


  return (
    <DashboardShell role="AGENT">
      <div className="space-y-6 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Tableau de bord</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {activeForm ? `Campagne active : ${activeForm.title} (${activeForm.period})` : "Aucune campagne active"}
          </p>
        </div>

        {activeForm && summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score global</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.global_score ? summary.global_score.toFixed(2) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Basé sur {summary.total_reviews || 0} évaluations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Évaluations reçues</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEvaluationsReceived}</div>
                <p className="text-xs text-muted-foreground">Évaluations par les pairs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Évaluations complétées</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEvaluationsDone}</div>
                <p className="text-xs text-muted-foreground">{completionRate}% de taux de complétion</p>
                <Progress value={completionRate} className="mt-2 h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Évaluations en attente</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expectedEvaluations}</div>
                <p className="text-xs text-muted-foreground">À compléter</p>
              </CardContent>
            </Card>
          </div>
        )}

        {categoryScores && categoryScores.length > 0 && (
          <CategoryScoresChart scores={categoryScores as AgentCategoryScore[]} />
        )}

        {pendingEvaluations && pendingEvaluations.length > 0 && <EvaluationsList evaluations={pendingEvaluations} />}

        <div className="grid gap-6 lg:grid-cols-2">
          {evaluationsGiven && evaluationsGiven.length > 0 && <EvaluationsGivenTable evaluations={evaluationsGiven} />}

          {evaluationsReceived && evaluationsReceived.length > 0 && (
            <EvaluationsReceivedTable evaluations={evaluationsReceived} agentId={user.id} formId={activeForm?.id} />
          )}
        </div>

        {pastCampaigns && pastCampaigns.length > 0 && <CampaignHistory campaigns={pastCampaigns as Form[]} />}
      </div>
    </DashboardShell>
  )
}
