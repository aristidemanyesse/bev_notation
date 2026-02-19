"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QuestionForm } from "@/components/admin/question-form"
import { useAuth } from "@/lib/actions/auth-context"
import { useEffect, useState } from "react"
import { api } from "@/lib/api/api"
import { Question, QuestionCategory } from "@/lib/types/database"
import { toast } from "@/hooks/use-toast"

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const {user} = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState<Question | null>(null)
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { id } = await params
      try {
        const qs = await api.get<QuestionCategory[]>("/api/question-categories/?is_active=true&ordering=-label")
        if (alive) setCategories(qs)

        const q = await api.get<Question>("/api/questions/" + id)
        if (alive) setQuestion(q)

      } catch (e) {
        if (!alive) return
        toast({
          title: "Erreur",
          description: "Erreur récupération des questions",
          variant: "destructive",
        })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])


  return (
    <DashboardShell role="ADMIN" user={user!}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Modifier une question</h2>
          <p className="text-muted-foreground">Mettre à jour les informations de la question</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails de la question</CardTitle>
            <CardDescription>Modifiez les paramètres de la question</CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionForm categories={categories || []} question={question!} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
