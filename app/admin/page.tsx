"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"

import { redirect } from "next/navigation"

import type { AdminCampaignStats, Form } from "@/lib/types/database"
import { AdminStatsCards } from "@/components/admin/admin-stats-cards"
import { CampaignsList } from "@/components/admin/campaigns-list"
import { CompletionChart } from "@/components/admin/completion-chart"
import { useAuth } from "@/lib/actions/auth-context"
import { useEffect, useState } from "react"
import { set } from "date-fns"
import { api } from "@/lib/api/api"
import { toast } from "@/hooks/use-toast"

interface AdminStats {
  totalAgents: 0,
  totalCampaigns: 0,
  totalCompleted: 0,
  overallCompletion: 0,
}

export default function AdminPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true)
  const [adminStat, setAdminStat] = useState<AdminStats | null>(null)
  const [campaigns, setCampaigns] = useState<AdminCampaignStats[]>([])

  // Get all campaign stats
  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const datas = await api.get<AdminCampaignStats[]>("/api/forms/admin/stats/",);
        setCampaigns(datas);
      } catch {
        toast({
          title: "Erreur",
          description: "Erreur récupération des statistiques de vos campagnes",
          variant: "destructive",
        });
      }

      try {
        const stats = await api.get<AdminStats>("/api/general/admin/stats");
        setAdminStat(stats);
      } catch {
        toast({
          title: "Erreur",
          description: "Erreur récupération des campagnes actives",
          variant: "destructive",
        });
      }

      setLoading(false)
    })();
  }, [])


  return (
    <DashboardShell role="ADMIN" user={user!}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Tableau de bord administrateur</h2>
            <p className="text-muted-foreground">Gérer les notations et surveiller la progression des notes</p>
          </div>
        </div>

        <AdminStatsCards
          totalAgents={adminStat?.totalAgents || 0}
          totalCampaigns={adminStat?.totalCampaigns || 0}
          totalCompleted={adminStat?.totalCompleted || 0}
          overallCompletion={adminStat?.overallCompletion || 0}
        />

        {/* {campaigns && campaigns.length > 0 && <CompletionChart campaigns={campaigns as AdminCampaignStats[]} />} */}
        {campaigns && campaigns.length > 0 && <CampaignsList campaigns={campaigns as AdminCampaignStats[]} />}
      </div>
    </DashboardShell>
  )
}
