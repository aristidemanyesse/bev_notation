import { EvaluationView } from "@/components/dashboard/evaluation-view"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/actions/auth"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Badge } from "lucide-react"
import { notFound } from "next/navigation"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EvaluationViewPage({ params }: PageProps) {
  const { id: evaluationId } = await params  // ✅ déstructure ici

  const supabase = await getSupabaseServerClient()

  // Récupération de l'évaluation avec ses réponses et les questions de son formulaire
  const { data: evaluation, error } = await supabase
    .from("evaluations")
    .select(`
      *,
      evaluated:agents!evaluations_evaluated_id_fkey(
        id,
        first_name,
        last_name,
        matricule
      ),
      answers(*),
      form:forms(
        id,
        title,
        period,
        questions:form_questions(
          id,
          question:questions(*)
        )
      )
    `)
    .eq("id", evaluationId)
    .maybeSingle()

  if (!evaluation) {
    notFound()
  }

  // Si form est un tableau (relation multiple), prendre le premier
  const form = Array.isArray(evaluation.form) ? evaluation.form[0] : evaluation.form
  const questionsWithAnswers = form.questions.map((fq: { question: { id: any } }) => {
    const answer = evaluation.answers.find((a: { question_id: any }) => a.question_id === fq.question.id)
    return {
      ...fq.question,
      score: answer?.score ?? null,
      comment: answer?.comment ?? "",
    }
  })

  const user = await getCurrentUser()
  return (
    <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"}>
  <div className="max-w-3xl mx-auto space-y-6">
    <div>
      <h2 className="text-3xl font-semibold tracking-tight">Formulaire d'évaluation</h2>
      <p className="text-muted-foreground">
        Visualisation des réponses pour {evaluation.evaluated.first_name} {evaluation.evaluated.last_name}
      </p>
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
          <Badge>{form.period}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{form.title}</p>
      </CardContent>
    </Card>

    <EvaluationView questions={questionsWithAnswers} answers={evaluation.answers} />
  </div>
</DashboardShell>

  )
}
