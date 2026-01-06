"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { AdminCampaignAgentStats } from "@/lib/types/database"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AgentPerformanceTableProps {
  agents: AdminCampaignAgentStats[]
}

type SortField = "name" | "score" | "completion"

export function AgentPerformanceTable({ agents }: AgentPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>("score")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const sortedAgents = [...agents].sort((a, b) => {
    let aValue: number | string = 0
    let bValue: number | string = 0

    switch (sortField) {
      case "name":
        aValue = `${a.first_name} ${a.last_name}`
        bValue = `${b.first_name} ${b.last_name}`
        break
      case "score":
        aValue = a.global_score || 0
        bValue = b.global_score || 0
        break
      case "completion":
        aValue = a.evaluations_done
        bValue = b.evaluations_done
        break
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance des agents</CardTitle>
        <CardDescription>Scores individuels et taux de complétion des notations</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("name")} className="h-8 px-2">
                  Agent
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Matricule</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("score")} className="h-8 px-2">
                  Moyenne
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("score")} className="h-8 px-2">
                  Note globale
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Reçues</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("completion")} className="h-8 px-2">
                  Complétées
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAgents.map((agent) => {
              const hasScore = agent.global_score !== null && agent.global_score !== undefined
              const scoreColor = hasScore
                ? agent.global_score >= 4
                  ? "text-green-600 dark:text-green-400"
                  : agent.global_score >= 3
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                : ""

              return (
                <TableRow key={agent.agent_id}>
                  <TableCell className="font-medium">
                    {agent.first_name} {agent.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{agent.matricule}</Badge>
                  </TableCell>
                  <TableCell className={scoreColor}>{hasScore ? agent.global_score : "N/A"}</TableCell>
                  <TableCell className={scoreColor}>{hasScore ? agent.global_score.toFixed() : "N/A"}</TableCell>
                  <TableCell>{agent.evaluations_received}</TableCell>
                  <TableCell>{agent.evaluations_done}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
