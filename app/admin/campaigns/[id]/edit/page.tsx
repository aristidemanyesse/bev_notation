"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CampaignEditForm } from "@/components/admin/campaign-edit-form"
import { Suspense, use, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/actions/auth-context"
import { Form, Question } from "@/lib/types/database"
import { api } from "@/lib/api/api"
import { toast } from "@/hooks/use-toast"
import { set } from "date-fns"

function FormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()

  const [form, setForm] = useState<Form | null>(null) 
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true

    ;(async () => {
      setLoading(true)
      try {
        const param = await params;
        const form = await api.get<Form>(`/api/forms/${param.id}`)
        if (!alive) return
        setForm(form)

        const selected = form?.questions?.map(fq => fq.question?.id) || []
        setSelectedQuestionIds(selected)

        const qs = await api.get<Question[]>(`/api/questions/?is_active=true&ordering=-weight`)
        setQuestions(qs)
        if (!alive) return

      } catch (e) {
        console.error(e)
        toast({
          title: "Erreur",
          description: "Erreur récupération des informations de la campagne",
          variant: "destructive",
        })
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [params])



  if (loading) {
    FormLoader()
  }

  return (
    <DashboardShell role="ADMIN" user={user!}>
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Modifier la notation</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Mettre à jour les paramètres de la notation du trimestre</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails du trimestre</CardTitle>
            <CardDescription>Modifiez les informations de la notation du trimestre</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormLoader />}>
              <CampaignEditForm form={form!} questions={questions || []} selectedQuestionIds={selectedQuestionIds} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
