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

  if (!user || user.role?.code !== "AGENT") {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select(
      `
      *,
      evaluated:agents!evaluations_evaluated_id_fkey(id, matricule, first_name, last_name),
      form:forms(id, title, period)
    `,
    )
    .eq("id", id)
    .eq("evaluator_id", user.id)
    .maybeSingle()

  if (!evaluation) {
    return (
      <DashboardShell role="AGENT">
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Évaluation non trouvée</h2>
          <p className="text-muted-foreground">Cette évaluation n'existe pas ou vous n'y avez pas accès.</p>
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
    <DashboardShell role="AGENT">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Formulaire d'évaluation</h2>
          <p className="text-muted-foreground">Complétez votre évaluation pour votre collègue</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {evaluation.evaluated.first_name} {evaluation.evaluated.last_name}
                </CardTitle>
                <CardDescription>Matricule: {evaluation.evaluated.matricule}</CardDescription>
              </div>
              <Badge>{evaluation.form.period}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{evaluation.form.title}</p>
          </CardContent>
        </Card>

        <EvaluationForm
          evaluationId={id}
          questions={questions}
          existingAnswers={existingAnswers || []}
          isSubmitted={!!evaluation.submitted_at}
        />
      </div>
    </DashboardShell>
  )
}
