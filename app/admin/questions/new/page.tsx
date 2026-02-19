"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { QuestionForm } from "@/components/admin/question-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/actions/auth-context"
import { toast } from "@/hooks/use-toast"
import { QuestionCategory } from "@/lib/types/database"
import { api } from "@/lib/api/api"

function FormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function NewQuestionPage() {
  const {user} = useAuth()

  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<QuestionCategory[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const qs = await api.get<QuestionCategory[]>("/api/question-categories/?is_active=true&ordering=-label")
        if (alive) setCategories(qs)
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
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Créer une nouvelle question</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Ajouter une nouvelle question de notation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails de la question</CardTitle>
            <CardDescription>Configurez les paramètres de la question</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormLoader />}>
              <QuestionForm categories={categories || []} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
