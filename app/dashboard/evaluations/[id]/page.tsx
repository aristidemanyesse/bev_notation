import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { EvaluationForm } from "@/components/evaluations/evaluation-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select(
      `
      *,
      evaluated:agents_public!evaluations_evaluated_id_fkey(id, matricule, first_name, last_name),
      form:forms(id, title, period)
    `,
    )
    .eq("id", id)
    .eq("evaluator_id", user.id)
    .maybeSingle()

  if (!evaluation) {
    return (
      <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"} user={user}>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Notation non trouvée</h2>
          <p className="text-muted-foreground">Cette notation n'existe pas ou vous n'y avez pas accès.</p>
        </div>
      </DashboardShell>
    )
  }

  const { data: formQuestions } = await supabase
    .from("form_questions")
    .select(
      `
      *,
      question:questions(*)
    `,
    )
    .eq("form_id", evaluation.form_id)
    .order("position", { ascending: true })

  const { data: existingAnswers } = await supabase.from("answers").select("*").eq("evaluation_id", id)

  const questions = formQuestions?.map((fq) => fq.question) || []

  return (
    <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"} user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Notation de {evaluation.evaluated.first_name} {evaluation.evaluated.last_name} <small className="text-muted-foreground">({evaluation.evaluated.matricule})</small></h2>
          <h5>{evaluation.form.title}</h5>
          <br></br>
          <p className="text-muted-foreground">Noter votre collègue</p>
        </div>

        <EvaluationForm
          evaluationId={id}
          formId={evaluation.form_id}
          questions={questions}
          existingAnswers={existingAnswers || []}
          isSubmitted={!!evaluation.submitted_at}
        />
      </div>
    </DashboardShell>
  )
}
