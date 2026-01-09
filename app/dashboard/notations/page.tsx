import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Eye } from "lucide-react"
import { CampaignSelect } from "@/components/dashboard/campaign-select"
import { EvaluationsReceivedTable } from "@/components/dashboard/evaluations-received-table"
import { AdminAgentsEvaluationsTable } from "@/components/dashboard/admin-agents-evaluations-table"

export default async function NotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await getSupabaseServerClient()

  // Campaigns actives
  const { data: activeCampaigns, error: campErr } = await supabase
    .from("forms")
    .select("id, title, period, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (campErr) throw campErr

  const campaigns = activeCampaigns ?? []
  const resolvedSearchParams = await searchParams
  const selectedCampaignId = resolvedSearchParams.campaignId ?? campaigns[0]?.id
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId)

  if (!selectedCampaignId) {
    return (
      <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"} user={user}>
        <div className="space-y-6 px-4 sm:px-0">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Notations</h2>
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
            <Eye className="h-6 w-6 opacity-50" />
            <p className="text-sm font-medium">Aucune campagne active</p>
            <p className="text-xs">Active une campagne pour afficher les notations.</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // 1) Mes notations reçues (AGENT: reçues par lui, ADMIN: s'il a des notations reçues/auto-éval)
  const { data: evaluationsReceived, error: myErr } = await supabase
    .from("evaluations")
    .select(
      `
      id,
      submitted_at,
      evaluator:agents_public!evaluations_evaluator_id_fkey(matricule, first_name, last_name),
      form:forms(title, period)
    `,
    )
    .eq("evaluated_id", user.id)
    .eq("form_id", selectedCampaignId)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })

  if (myErr) throw myErr

  // 2) Notations des agents (ADMIN seulement)
  // Par défaut : toutes les évaluations où la personne évaluée est AGENT.
  // Si tu veux "entre agents uniquement" (exclure admin->agent), ajoute aussi evaluator.role_code = 'AGENT' (voir plus bas).
  let agentsEvaluations: any[] = []
  if (user.role?.code === "ADMIN") {
    const { data: agentsEvaluations, error } = await supabase
      .from("admin_agents_evaluations")
      .select("*")
      .eq("form_id", selectedCampaignId)
      .order("submitted_at", { ascending: false })

    if (error) throw error
  }

  return (
    <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"} user={user}>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {user.role?.code === "ADMIN"
                ? `Notations — ${selectedCampaign?.title}`
                : `Mes notations — ${selectedCampaign?.title}`}
            </h2>
          </div>

          <CampaignSelect
            campaigns={activeCampaigns}
            selectedCampaignId={selectedCampaignId}
            path="/dashboard/notations?campaignId="
          />
        </div>

        {/* Bloc 1 : Mes notations (toujours visible) */}
        {user.role?.code === "AGENT" && (
        <div className="grid gap-6">
          {evaluationsReceived && evaluationsReceived.length > 0 ? (
            <EvaluationsReceivedTable evaluations={evaluationsReceived as any} agentId={user.id} formId={selectedCampaignId} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
              <Eye className="h-6 w-6 opacity-50" />
              <p className="text-sm font-medium">Aucune notation reçue</p>
              <p className="text-xs">Les résultats apparaîtront ici une fois que des collègues auront noté.</p>
            </div>
          )}
        </div>
        )}

        {/* Bloc 2 : Notations des agents (ADMIN seulement) */}
        {user.role?.code === "ADMIN" && (
          <div className="grid gap-6">
            {agentsEvaluations.length > 0 ? (
              <AdminAgentsEvaluationsTable evaluations={agentsEvaluations} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
                <Eye className="h-6 w-6 opacity-50" />
                <p className="text-sm font-medium">Aucune notation des agents</p>
                <p className="text-xs">Les notations soumises entre agents apparaîtront ici.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
