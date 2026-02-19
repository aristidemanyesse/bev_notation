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
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/actions/auth-context";
import { api } from "@/lib/api/api";
import { downloadEvaluationPdf } from "./evaluations-received-table";

export function AdminAgentsEvaluationsTable({ form }: { form: Form }) {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationNotee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 50, 100] as const;
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(20);

  const totalItems = evaluations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    (async () => {
      if (!form) return;
      const datas = await api.get<EvaluationNotee[]>(
        `/api/forms/${form.id}/evaluations/all-submitted/`,
      );
      setEvaluations(datas);
      setLoading(false);
    })();
  }, [form]);

  // Si evaluations change (filtre, reload), on garde page valide
  useMemo(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedEvaluations = useMemo(() => {
    const start = (page - 1) * pageSize;
    return evaluations.slice(start, start + pageSize);
  }, [evaluations, page, pageSize]);

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
                <TableHead className="text-white">Évaluateur</TableHead>
                <TableHead className="text-white">Évalué</TableHead>
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
              {pagedEvaluations.map((eva) => {
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
                        <span>{evaluatorName || "-"}</span>
                        <span className="text-xs text-muted-foreground">
                          {evaluatorMat}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{evaluatedName || "-"}</span>
                        <span className="text-xs text-muted-foreground">
                          {evaluatedMat}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadEvaluationPdf(eva.evaluation)}
                      >
                        <HardDriveDownload className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage{" "}
            <span className="font-medium text-foreground">
              {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{" "}
            à{" "}
            <span className="font-medium text-foreground">
              {Math.min(page * pageSize, totalItems)}
            </span>{" "}
            sur{" "}
            <span className="font-medium text-foreground">{totalItems}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Lignes/page</span>
            <select
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as any);
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>

            <div className="min-w-[90px] text-center text-sm">
              Page <span className="font-medium">{page}</span> /{" "}
              <span className="font-medium">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
