"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AdminCampaignStats } from "@/lib/types/database"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { toggleCampaignStatus } from "@/lib/actions/campaigns"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface CampaignsListProps {
  campaigns: AdminCampaignStats[]
}

export function CampaignsList({ campaigns }: CampaignsListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggle = async (formId: string, currentStatus: boolean) => {
    setLoading(formId)
    await toggleCampaignStatus( router, formId, !currentStatus)
    setLoading(null)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recentes notations</CardTitle>
        <CardDescription>Liste des dernières notations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns.slice(0, 5).map((campaign) => {
            const completionRate = campaign.completion_rate || 0
            const status = completionRate >= 100 ? "complete" : completionRate >= 50 ? "in-progress" : "low"

            return (
              <div
                key={campaign.form.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{campaign.form.title}</p>
                    <Badge
                      variant={status === "complete" ? "default" : status === "in-progress" ? "secondary" : "outline"}
                    >
                      {completionRate.toFixed(0)}% complete
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.total_submitted_evaluations} / {campaign.total_expected_evaluations}{" "}
                    notations
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/campaigns/${campaign.form.id}`}>
                      Details
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
