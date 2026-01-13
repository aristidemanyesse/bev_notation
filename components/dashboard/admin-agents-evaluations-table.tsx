import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, HardDriveDownload } from "lucide-react"
import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/server"

type PersonRef = {
  matricule?: string | null
  first_name?: string | null
  last_name?: string | null
  role_code?: string | null
} | null

type AdminAgentEvaluationInput = {
  id: string
  submitted_at: string | null
  evaluator_matricule?: string | null
  evaluator_first_name?: string | null
  evaluator_last_name?: string | null
  evaluator_role_code?: string | null
  evaluated_matricule?: string | null
  evaluated_first_name?: string | null
  evaluated_last_name?: string | null
}

type EvaluationSummaryRow = {
  evaluation_id: string
  completion_pct: number | null
  weighted_avg_score: number | null
}

interface AdminAgentsEvaluationsTableProps {
  evaluations: AdminAgentEvaluationInput[]
}

export async function AdminAgentsEvaluationsTable({ evaluations }: AdminAgentsEvaluationsTableProps) {
  const supabase = await getSupabaseServerClient()

  if (!evaluations?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notations des agents</CardTitle>
          <CardDescription>Notes reçues par les agents pour la campagne sélectionnée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Aucune donnée.</div>
        </CardContent>
      </Card>
    )
  }

  const evaluationIds = evaluations.map((e) => e.id)

  const { data: summaries, error } = await supabase
    .from("evaluation_summary")
    .select("evaluation_id, completion_pct, weighted_avg_score")
    .in("evaluation_id", evaluationIds)

  if (error) throw error

  const summaryById = new Map<string, EvaluationSummaryRow>(
    (summaries ?? []).map((s: EvaluationSummaryRow) => [s.evaluation_id, s]),
  )

  const rows = evaluations.map((evaluation) => {
    const s = summaryById.get(evaluation.id)
    const completionPct = s?.completion_pct ?? 0
    const avgScore = typeof s?.weighted_avg_score === "number" ? s.weighted_avg_score : null

    return { ...evaluation, completionPct, avgScore }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notations des agents</CardTitle>
        <CardDescription>Notes reçues par les agents pour la campagne sélectionnée</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary">
                <TableHead className="text-white">Évalué</TableHead>
                <TableHead className="text-white">Évaluateur</TableHead>
                <TableHead className="text-center text-white">Taux</TableHead>
                <TableHead className="text-center text-white">Moyenne</TableHead>
                <TableHead className="text-center text-white">Note globale</TableHead>
                <TableHead className="text-center text-white">Date</TableHead>
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((evaluation) => {
                const evaluatedName = `${evaluation?.evaluated_first_name ?? ""} ${evaluation?.evaluated_last_name ?? ""}`.trim()
                const evaluatedMat = evaluation?.evaluated_matricule ?? ""

                const evaluatorName = `${evaluation?.evaluator_first_name ?? ""} ${evaluation?.evaluator_last_name ?? ""}`.trim()
                const evaluatorMat = evaluation?.evaluator_matricule ?? ""

                const completion = evaluation.completionPct
                const avgLabel = typeof evaluation.avgScore === "number" ? evaluation.avgScore.toFixed(2) : "N/A"
                const globalLabel =
                  typeof evaluation.avgScore === "number" ? Math.round(evaluation.avgScore).toString() : "N/A"

                const dateLabel = evaluation.submitted_at
                  ? new Date(evaluation.submitted_at).toLocaleDateString("fr-FR")
                  : "-"

                return (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{evaluatedName || "-"}</span>
                        <span className="text-xs text-muted-foreground">{evaluatedMat}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{evaluatorName || "-"}</span>
                        <span className="text-xs text-muted-foreground">{evaluatorMat}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={completion === 100 ? "default" : "secondary"}>{completion}%</Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-semibold">{avgLabel}</span>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-semibold">{globalLabel}</span>
                    </TableCell>

                    <TableCell className="text-center text-sm text-muted-foreground">{dateLabel}</TableCell>

                    <TableCell className="text-right">
                      <Link href={`/dashboard/evaluations/${evaluation.id}/view`} className="mr-3">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      <Link href={`/dashboard/evaluations/${evaluation.id}/telecharger`}>
                        <Button variant="ghost" size="sm">
                          <HardDriveDownload className="h-4 w-4 mr-1" />
                          Télécharger
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
