"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"

import { CampaignCreationForm } from "@/components/admin/campaign-creation-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/actions/auth-context"
import { Agent, Question } from "@/lib/types/database"
import { api } from "@/lib/api/api"
import { toast } from "@/hooks/use-toast"

function FormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function NewCampaignPage() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const qs = await api.get<Question[]>(`/api/questions/?is_active=true&ordering=-weight`)
        if (!alive) return
        setQuestions(qs)

        const agents = await api.get<Agent[]>(`/api/agents/?is_active=true&ordering=-last_name`)
        if (!alive) return
        setAgents(agents)

      } catch (e) {
        console.error(e)
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
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Créer une nouveau trimestre</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Configurer une nouveau trimestre de notation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails du trimestre</CardTitle>
            <CardDescription>Configurez les paramètres de la notation du trimestre</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormLoader />}>
              <CampaignCreationForm questions={questions || []} agents={agents || []} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
