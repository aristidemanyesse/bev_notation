import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, FileText, CheckCircle2, TrendingUp } from "lucide-react"

interface AdminStatsCardsProps {
  totalAgents: number
  totalCampaigns: number
  totalCompleted: number
  overallCompletion: number
}

export function AdminStatsCards({
  totalAgents,
  totalCampaigns,
  totalCompleted,
  overallCompletion,
}: AdminStatsCardsProps) {
  const stats = [
    {
      label: "Total des agents",
      value: totalAgents,
      icon: Users,
      description: "Agents actifs dans le système",
    },
    {
      label: "Total de Trimestres",
      value: totalCampaigns,
      icon: FileText,
      description: "Notations actives dans le système",
    },
    {
      label: "Nombre de collègues notés",
      value: totalCompleted,
      icon: CheckCircle2,
      description: "Tous trimestres confondus",
    },
    {
      label: "Complétion globale",
      value: `${overallCompletion}%`,
      icon: TrendingUp,
      description: "Taux de complétion de la plateforme",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.label === "Complétion globale" && <Progress value={overallCompletion} className="mt-2 h-1" />}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
