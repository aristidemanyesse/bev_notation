import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, CheckCircle2 } from "lucide-react"

interface EvaluationsListProps {
evaluations: any[]
}

export function EvaluationsList({ evaluations }: EvaluationsListProps) {
const pending = evaluations.filter((e) => !e.submitted_at)
const completed = evaluations.filter((e) => e.submitted_at)

return (
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Évaluations</CardTitle>
        <CardDescription>
          {pending.length} en attente, {completed.length} complétées
        </CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      {pending.length > 0 ? (
      pending.map((evaluation) => (
      <div key={evaluation.id}
        className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            {evaluation.evaluated.first_name[0]}
            {evaluation.evaluated.last_name[0]}
          </div>
          <div>
            <p className="font-medium">
              {evaluation.evaluated.first_name} {evaluation.evaluated.last_name}
            </p>
            <p className="text-sm text-muted-foreground">Matricule : {evaluation.evaluated.matricule}</p>
          </div>
        </div>
        <div className="flex h-10 w-50 items-center justify-center text-sm font-semibold">
          <div className="text-sm text-muted-foreground">
            <p>Campagne : {evaluation.form_title}</p>
            <p>Période : {evaluation.form_period}</p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href={`/dashboard/evaluations/${evaluation.id}`}> Évaluer <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      ))
      ) : (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Toutes les évaluations sont complétées !</p>
      </div>
      )}
    </div>
  </CardContent>
</Card>
)
}