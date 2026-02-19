"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { QuestionActions } from "@/components/admin/question-actions"
import { useAuth } from "@/lib/actions/auth-context"
import { toast } from "@/hooks/use-toast"
import { Question } from "@/lib/types/database"
import { api } from "@/lib/api/api"
import { useEffect, useState } from "react"

export default function QuestionsPage() {
  const {user} = useAuth()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const qs = await api.get<Question[]>("/api/questions/?is_active=true&ordering=-weight")
        if (alive) setQuestions(qs)
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Questions ({questions?.length || 0})</h2>
            <p className="text-muted-foreground">Gérer les questions de notations</p>
          </div>
          <Button asChild>
            <Link href="/admin/questions/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle question
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Toutes les questions</CardTitle>
            <CardDescription>Liste de toutes les questions de notation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questions && questions.length > 0 ? (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{question.label}</h3>
                        {question.category && <Badge variant="secondary">{question.category.label}</Badge>}
                        <Badge variant={question.is_active ? "default" : "outline"}>
                          {question.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {question.description && <p className="text-sm text-muted-foreground">{question.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">Poids: {question.weight}</p>
                    </div>
                    <QuestionActions question={question} />
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune question trouvée.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
