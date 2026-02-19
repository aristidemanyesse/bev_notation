"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { EvaluationForm } from "@/components/evaluations/evaluation-form"
import { useAuth } from "@/lib/actions/auth-context"
import { api } from "@/lib/api/api"
import type { Answer, Evaluation, FormQuestion, Question } from "@/lib/types/database"

export default function EvaluationPage() {
  const { user } = useAuth()
  const params = useParams()
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id

  const [loading, setLoading] = useState(true)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([])
  const [existingAnswers, setExistingAnswers] = useState<Answer[]>([])

  useEffect(() => {
    if (!id) return

    ;(async () => {
      try {
        const e = await api.get<Evaluation>(`/api/evaluations/${id}`)
        setEvaluation(e)

      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (!user) {
    return <div>Chargement…</div>
  }

  if (loading) {
    return (
      <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"} user={user}>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Chargement…</h2>
        </div>
      </DashboardShell>
    )
  }

  if (!evaluation) {
    return (
      <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"} user={user}>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Notation non trouvée</h2>
          <p className="text-muted-foreground">
            Cette notation n&apos;existe pas ou vous n&apos;y avez pas accès.
          </p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"} user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Notation de {evaluation.evaluated.first_name} {evaluation.evaluated.last_name}{" "}
            <small className="text-muted-foreground">({evaluation.evaluated.matricule})</small>
          </h2>
          <h5>
            {evaluation.form.title} - {evaluation.form.period}
          </h5>
          <br />
          <p className="text-muted-foreground">Noter votre collègue</p>
        </div>

        <EvaluationForm
          evaluation={evaluation}
        />
      </div>
    </DashboardShell>
  )
}
