"use client"


import { DashboardShell } from "@/components/layout/dashboard-shell"
import { AgentPerformanceTable } from "@/components/admin/agent-performance-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CampaignStatusToggle } from "@/components/admin/campaign-status-toggle"
import { Button } from "@/components/ui/button"
import { Suspense, use, useEffect, useState } from "react"
import { Loader2, Edit } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/actions/auth-context"
import { AdminCampaignStats, Form } from "@/lib/types/database"
import { api } from "@/lib/api/api"
import { toast } from "@/hooks/use-toast"
import { stat } from "fs"

function CampaignLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

interface PageParams {
  id: string
}

export default function CampaignDetailsPage({ params }: { params: PageParams | Promise<PageParams> }) {
  const { user } = useAuth()

  const [campaign, setCampaign] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [campaignStats, setCampaignStats] = useState<AdminCampaignStats | null>(null)


  useEffect(() => {
    ;(async () => {
      const { id } = await params
    if (!id) return
      try {
        const campaign = await api.get<Form>(`/api/forms/${id}`)
        setCampaign(campaign)

        const stats = await api.get<AdminCampaignStats>(`/api/forms/${id}/stats`)
        setCampaignStats(stats)
      
      } catch {
        toast({
          title: "Erreur",
          description: "Erreur récupération des statistiques de la campagne",
          variant: "destructive",
        });
      }

    })();
  }, [params])


  return (
    <DashboardShell role="ADMIN" user={user!}>
      <Suspense fallback={<CampaignLoader />}>
        <div className="space-y-6 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{campaign?.title}</h2>
                <Badge variant={campaignStats?.completion_rate ?? 0 >= 75 ? "default" : "secondary"}>{campaign?.period}</Badge>
                <Badge variant={campaign?.is_active ? "default" : "outline"}>{campaign?.is_active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                Analyses détaillées du trimestre et performances des agents
              </p>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/campaigns/${campaign?.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {campaign && (

            <CampaignStatusToggle formId={campaign.id} isActive={campaign?.is_active ?? false} />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaignStats?.total_agents}</div>
                <p className="text-xs text-muted-foreground">Participant à cette notation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Notations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaignStats?.total_submitted_evaluations} / {campaignStats?.total_expected_evaluations}
                </div>
                <p className="text-xs text-muted-foreground">Nombre de collègues notés</p>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaignStats?.completion_rate.toFixed(1)}%</div>
                <Progress value={campaignStats?.completion_rate} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          <AgentPerformanceTable campaign={campaign!} />

        </div>
      </Suspense>
    </DashboardShell>
  )
}
