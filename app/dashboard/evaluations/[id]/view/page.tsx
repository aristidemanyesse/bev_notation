"use client"

import { EvaluationView } from "@/components/dashboard/evaluation-view"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/actions/auth-context"
import { api } from "@/lib/api/api"
import { Answer, Evaluation } from "@/lib/types/database"
import { use, useEffect, useMemo, useState } from "react"

type PageProps = {
  params: Promise<{ id: string }>
}

export default function EvaluationViewPage({ params }: PageProps) {
  const { user } = useAuth()
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [answers, setAnswers] = useState<any>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
         const { id: evaluationId } = await params 
        const evaluation = await api.get<Evaluation>(`/api/evaluations/${evaluationId}/`);
        const answers = await api.get<Answer>(`/api/evaluations/${evaluationId}/answers/`);
        if (cancelled) return;
        setEvaluation(evaluation);
        setAnswers(answers);

      } catch (e) {
        console.error("[v0] Erreur récupération campagnes actives", e);
      }
    })();

    return () => {
      cancelled = true;
    };
    // ✅ IMPORTANT: PAS de selectedCampaign en deps
  }, [params]);


  return (
    <DashboardShell role={user?.role?.code as "ADMIN" | "AGENT"} user={user!}>
  <div className="max-w-3xl mx-auto space-y-6">
    <div>
          <h2 className="text-3xl font-semibold tracking-tight">Notation de {evaluation?.evaluator.first_name} {evaluation?.evaluator.last_name} <small className="text-muted-foreground">({evaluation?.evaluator.matricule})</small></h2>
          <h5>{evaluation?.form.title} - {evaluation?.form.period}</h5>
          <br></br>
          <p className="text-muted-foreground">Visualisation des réponses de votre collègue</p>
        </div>

    <EvaluationView questions={evaluation?.form.questions!} answers={answers} />
  </div>
</DashboardShell>

  )
}
