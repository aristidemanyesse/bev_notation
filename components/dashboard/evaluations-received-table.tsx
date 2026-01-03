import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/server"

interface EvaluationsReceivedTableProps {
  evaluations: any[]
  agentId: string
  formId?: string
}

export async function EvaluationsReceivedTable({ evaluations, agentId, formId }: EvaluationsReceivedTableProps) {
  const supabase = await getSupabaseServerClient()

  // Récupérer les scores moyens pour chaque évaluation
  const evaluationsWithScores = await Promise.all(
    evaluations.map(async (evaluation) => {
      const { data: answers } = await supabase.from("answers").select("score").eq("evaluation_id", evaluation.id)

      const totalQuestions = answers?.length || 0
      const answeredQuestions = answers?.filter((a) => a.score !== null).length || 0
      const completionPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
      const avgScore = answers?.length
        ? (answers.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length).toFixed(2)
        : "N/A"

      return {
        ...evaluation,
        completionPct,
        avgScore,
      }
    }),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évaluations reçues</CardTitle>
        <CardDescription>Les évaluations que vous avez reçues lors de la dernière campagne</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Évaluateur</TableHead>
                <TableHead className="text-center">Complétion</TableHead>
                <TableHead className="text-center">Note globale</TableHead>
                <TableHead className="text-center">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluationsWithScores.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>
                        {evaluation.evaluator?.first_name} {evaluation.evaluator?.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{evaluation.evaluator?.matricule}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={evaluation.completionPct === 100 ? "default" : "secondary"}>
                      {evaluation.completionPct}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold">{evaluation.avgScore}</span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {new Date(evaluation.submitted_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/evaluations/${evaluation.id}/view`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
