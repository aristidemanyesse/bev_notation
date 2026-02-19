"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/actions/auth-context"
import { api } from "@/lib/api/api"
import { toast } from "@/hooks/use-toast"
import type { AdminCampaignStats } from "@/lib/types/database"
import { DashboardShell } from "@/components/layout/dashboard-shell"

function CampaignsList() {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<AdminCampaignStats[]>([])

  useEffect(() => {
    let alive = true

    ;(async () => {
      setLoading(true)
      try {
        const datas = await api.get<AdminCampaignStats[]>("/api/forms/admin/stats")
        if (!alive) return
        setCampaigns(datas)
      } catch (e) {
        if (!alive) return
        toast({
          title: "Erreur",
          description: "Erreur récupération des statistiques de vos campagnes",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tous les trimestres</CardTitle>
        <CardDescription>Liste complète des notations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns.length > 0 ? (
            campaigns.map((campaign) => {
              const completionRate = campaign.completion_rate || 0
              return (
                <div
                  key={campaign.form.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{campaign.form.title}</h3>
                      <Badge variant={completionRate >= 75 ? "default" : "secondary"}>
                        {completionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.form.period} • {campaign.total_agents} agents • {campaign.total_submitted_evaluations} /{" "}
                      {campaign.total_expected_evaluations} notations
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                    <Link href={`/admin/campaigns/${campaign.form.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </Link>
                  </Button>
                </div>
              )
            })
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune notation trouvée. Créez votre premier trimestre de notation.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function CampaignsPage() {
  const { user } = useAuth()

  return (
    <DashboardShell role="ADMIN" user={user!}>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Trimestres</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Gérer les notations et suivre la progression
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau trimestre
            </Link>
          </Button>
        </div>

        {/* Suspense inutile ici, on l’enlève */}
        <CampaignsList />
      </div>
    </DashboardShell>
  )
}
