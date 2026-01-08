import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, HardDriveDownload } from "lucide-react"
import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/server"

type EvaluationReceivedInput = {
  id: string
  submitted_at: string | null
  evaluator?: {
    matricule?: string | null
    first_name?: string | null
    last_name?: string | null
  } | null
}

type EvaluationSummaryRow = {
  evaluation_id: string
  completion_pct: number | null
  weighted_avg_score: number | null
}

interface EvaluationsReceivedTableProps {
  evaluations: EvaluationReceivedInput[]
  agentId: string
  formId?: string
}

/**
 * Version optimisée:
 * - 1 requête batch sur evaluation_summary (pas de N+1 sur answers)
 * - Moyenne pondérée (weighted_avg_score)
 * - Note globale = arrondi entier de la moyenne
 */
export async function EvaluationsReceivedTable({ evaluations }: EvaluationsReceivedTableProps) {
  const supabase = await getSupabaseServerClient()

  if (!evaluations?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Les agents qui vous ont notés</CardTitle>
          <CardDescription>Les notations que vous avez reçues lors du trimestre</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Aucune notation reçue.</div>
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

    return {
      ...evaluation,
      completionPct,
      avgScore,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Les agents qui vous ont notés</CardTitle>
        <CardDescription>Les notations que vous avez reçues lors du trimestre</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary">
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
                const firstName = evaluation.evaluator?.first_name ?? ""
                const lastName = evaluation.evaluator?.last_name ?? ""
                const matricule = evaluation.evaluator?.matricule ?? ""

                const completion = evaluation.completionPct
                const avgLabel = typeof evaluation.avgScore === "number" ? evaluation.avgScore.toFixed(2) : "N/A"
                const globalLabel = typeof evaluation.avgScore === "number" ? Math.round(evaluation.avgScore).toString() : "N/A"

                const dateLabel = evaluation.submitted_at
                  ? new Date(evaluation.submitted_at).toLocaleDateString("fr-FR")
                  : "-"

                return (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>
                          {firstName} {lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">{matricule}</span>
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
