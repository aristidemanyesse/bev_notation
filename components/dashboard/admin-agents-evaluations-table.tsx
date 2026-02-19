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
import { Eye, HardDriveDownload } from "lucide-react";
import Link from "next/link";
import { EvaluationNotee, Form } from "@/lib/types/database";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/actions/auth-context";
import { api } from "@/lib/api/api";

type PersonRef = {
  matricule?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role_code?: string | null;
} | null;

type AdminAgentEvaluationInput = {
  id: string;
  submitted_at: string | null;
  evaluator_matricule?: string | null;
  evaluator_first_name?: string | null;
  evaluator_last_name?: string | null;
  evaluator_role_code?: string | null;
  evaluated_matricule?: string | null;
  evaluated_first_name?: string | null;
  evaluated_last_name?: string | null;
};

type EvaluationSummaryRow = {
  evaluation_id: string;
  completion_pct: number | null;
  weighted_avg_score: number | null;
};

interface AdminAgentsEvaluationsTableProps {
  evaluations: AdminAgentEvaluationInput[];
}

export function AdminAgentsEvaluationsTable({ form }: { form: Form }) {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationNotee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!form) return;
      const datas = await api.get<EvaluationNotee[]>(
        `/api/forms/${form.id}/evaluations/submitted/stats/`,
      );
      setEvaluations(datas);
      setLoading(false);
    })();
  }, [form]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notations des agents</CardTitle>
          <CardDescription>
            Notes reçues par les agents pour la campagne sélectionnée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Chargement…</div>
        </CardContent>
      </Card>
    );
  }

  if (!evaluations?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
        <Eye className="h-6 w-6 opacity-50" />
        <p className="text-sm font-medium">Aucune notation des agents</p>
        <p className="text-xs">
          Les notations soumises entre agents apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notations des agents</CardTitle>
        <CardDescription>
          Notes reçues par les agents pour la campagne sélectionnée
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary">
                <TableHead className="text-white">Évalué</TableHead>
                <TableHead className="text-white">Évaluateur</TableHead>
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
              {evaluations.map((eva) => {
                const evaluatedName =
                  `${eva.evaluation?.evaluated.first_name ?? ""} ${eva.evaluation?.evaluated.last_name ?? ""}`.trim();
                const evaluatedMat = eva.evaluation?.evaluated.matricule ?? "";

                const evaluatorName =
                  `${eva.evaluation?.evaluator.first_name ?? ""} ${eva.evaluation?.evaluator.last_name ?? ""}`.trim();
                const evaluatorMat = eva.evaluation?.evaluator.matricule ?? "";

                const completion = eva.completion_pct;
                const avgLabel =
                  typeof eva.weighted_avg_score === "number"
                    ? eva.weighted_avg_score.toFixed(2)
                    : "N/A";
                const globalLabel =
                  typeof eva.weighted_avg_score === "number"
                    ? Math.round(eva.weighted_avg_score).toString()
                    : "N/A";

                const dateLabel = eva.evaluation.submitted_at
                  ? new Date(eva.evaluation.submitted_at).toLocaleDateString(
                      "fr-FR",
                    )
                  : "-";

                return (
                  <TableRow key={eva.evaluation.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{evaluatedName || "-"}</span>
                        <span className="text-xs text-muted-foreground">
                          {evaluatedMat}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{evaluatorName || "-"}</span>
                        <span className="text-xs text-muted-foreground">
                          {evaluatorMat}
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
                        href={`/dashboard/evaluations/${eva.evaluation.id}/view`}
                        className="mr-3"
                      >
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/evaluations/${eva.evaluation.id}/telecharger`}
                      >
                        <Button variant="ghost" size="sm">
                          <HardDriveDownload className="h-4 w-4 mr-1" />
                          Télécharger
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
