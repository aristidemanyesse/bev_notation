import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { AgentDashboardSummary } from "@/lib/types/database"
import { CheckCircle2, Clock, Star, Users } from "lucide-react"

interface DashboardStatsProps {
  summary: AgentDashboardSummary
  expectedEvaluations: number
}

export function DashboardStats({ summary, expectedEvaluations }: DashboardStatsProps) {
  const completionRate =
    expectedEvaluations > 0 ? Math.round((summary.evaluations_done / expectedEvaluations) * 100) : 0

  const stats = [
    {
      label: "Note globale",
      value: summary.global_score ? summary.global_score.toFixed(2) : "N/A",
      icon: Star,
      description: `Basé sur ${summary.total_reviews || 0} notations`,
    },
    {
      label: "Collègues qui m'ont notés",
      value: summary.evaluations_received,
      icon: Users,
      description: "Notations par les pairs",
    },
    {
      label: "Nombre de collègues notés",
      value: summary.evaluations_done,
      icon: CheckCircle2,
      description: `${completionRate}% de Taux de complétion`,
    },
    {
      label: "Nbre de collègues restants",
      value: expectedEvaluations,
      icon: Clock,
      description: "À compléter",
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
              {stat.label === "Nombre de collègues notés" && <Progress value={completionRate} className="mt-2 h-1" />}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
