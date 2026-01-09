import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Form } from "@/lib/types/database"
import { Calendar } from "lucide-react"

interface CampaignHistoryProps {
  campaigns: Form[]
}

export function CampaignHistory({ campaigns }: CampaignHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des trimestres</CardTitle>
        <CardDescription>Vos notations trimestrielles passées</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{campaign.title}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
