import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api/api";
import { useEffect, useState } from "react";
import { Evaluation, EvaluationNotee, Form } from "@/lib/types/database";
import { useAuth } from "@/lib/actions/auth-context";


/**
 * Version optimisée:
 * - 1 requête batch sur evaluation_summary (pas de N+1 sur answers)
 * - Affichage "Note globale" = arrondi entier de la moyenne pondérée
 */
export function EvaluationsGivenTable({ form }: { form: Form }) {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationNotee[]>([]);

  useEffect(() => {
    (async () => {
      if (!form) return;
      const datas = await api.get<EvaluationNotee[]>(
        `/api/forms/${form.id}/evaluations/given/`,
      );
      setEvaluations(datas);
    })();
  }, [form]);

  // Rien à afficher
  if (!evaluations?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
        <Eye className="h-6 w-6 opacity-50" />
        <p className="text-sm">
          Vous n’avez encore soumis aucune notation pour ce trimestre.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Les agents que vous avez notés</CardTitle>
        <CardDescription>
          Les agents que vous avez noté lors du trimestre
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary">
              <TableRow>
                <TableHead className="text-white">Agent</TableHead>
                <TableHead className="text-center text-white">Taux</TableHead>
                <TableHead className="text-center text-white">
                  Moyenne
                </TableHead>
                <TableHead className="text-center text-white">
                  Note globale
                </TableHead>
                <TableHead className="text-center text-white">Date</TableHead>
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {evaluations.map((summary) => {
                const firstName =
                  summary.evaluation.evaluated?.first_name ?? "";
                const lastName = summary.evaluation.evaluated?.last_name ?? "";
                const matricule = summary.evaluation.evaluated?.matricule ?? "";

                const completion = summary.completion_pct;
                const avgLabel =
                  typeof summary.weighted_avg_score === "number"
                    ? summary.weighted_avg_score.toFixed(2)
                    : "N/A";
                const globalLabel =
                  typeof summary.weighted_avg_score === "number"
                    ? Math.round(summary.weighted_avg_score).toString()
                    : "N/A";

                const dateLabel = summary.evaluation.submitted_at
                  ? new Date(
                      summary.evaluation.submitted_at,
                    ).toLocaleDateString("fr-FR")
                  : "-";

                return (
                  <TableRow key={summary.evaluation.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>
                          {firstName} {lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {matricule}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={completion === 100 ? "default" : "secondary"}
                      >
                        {completion}%
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-semibold">{avgLabel}</span>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-semibold">{globalLabel}</span>
                    </TableCell>

                    <TableCell className="text-center text-sm text-muted-foreground">
                      {dateLabel}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/evaluations/${summary.evaluation.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
