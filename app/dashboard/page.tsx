import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, FileText, CheckCircle2, TrendingUp, Plus, Link } from "lucide-react"
import { CampaignSelect } from "@/components/dashboard/campaign-select"

export default async function DashboardPage({searchParams}: {searchParams: Promise<{ campaignId?: string }>}) {
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
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight ">Tableau de bord du {selectedCampaign?.title}</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedCampaign
                ? selectedCampaign.period
                : "Aucune campagne active"}
            </p>
          </div>
          <CampaignSelect
            campaigns = {activeCampaigns}
            selectedCampaignId={selectedCampaignId}
            path = "/dashboard?campaignId="
          />
        </div>
        <p className="h-5"> </p>
        

        {selectedCampaign && summary && (
          <div className="grid gap-10 sm:grid-cols-3 grid-flow-row auto-rows-max">
            <div className="col-span-1">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Note globale</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-center h-55">
                  <div className="h-6"> </div>
                  <div className="text-8xl font-bold">
                    {summary.global_score ? summary.global_score.toFixed() : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Note du {selectedCampaign?.title}</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 col-span-2 sm:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-secondary">Moyenne</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary.global_score ? summary.global_score.toFixed(2) : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Totaux des notes affectés des coefficients / 18 </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-secondary">Notations reçues</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalEvaluationsReceived}</div>
                  <p className="text-xs text-muted-foreground">Ceux qui vous ont notés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-secondary">Notations complétées</CardTitle>
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
                  <CardTitle className="text-sm font-medium text-secondary">Notations en attente</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{expectedEvaluations}</div>
                  <p className="text-xs text-muted-foreground">Notations à terminer</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}


        {/* {pastCampaigns && pastCampaigns.length > 0 && <CampaignHistory campaigns={pastCampaigns as Form[]} />} */}
      </div>
    </DashboardShell>
  )
}
