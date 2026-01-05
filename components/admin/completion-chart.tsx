"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdminCampaignStats } from "@/lib/types/database"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface CompletionChartProps {
  campaigns: AdminCampaignStats[]
}

export function CompletionChart({ campaigns }: CompletionChartProps) {
  const chartData = campaigns.slice(0, 6).map((campaign) => ({
    period: campaign.period,
    completed: campaign.total_submitted_evaluations,
    expected: campaign.total_expected_evaluations,
  }))

  const chartConfig = {
    completed: {
      label: "Complétées",
      color: "hsl(var(--chart-1))",
    },
    expected: {
      label: "Attendues",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taux de complétion</CardTitle>
        <CardDescription>Complétion des notations sur les trimestres récentes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="period" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="completed" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expected" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
