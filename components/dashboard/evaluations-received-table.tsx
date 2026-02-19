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
import { useAuth } from "@/lib/actions/auth-context";
import { useEffect, useState } from "react";
import { Evaluation, EvaluationNotee, Form } from "@/lib/types/database";
import { api } from "@/lib/api/api";

/**
 * Version optimisée:
 * - 1 requête batch sur evaluation_summary (pas de N+1 sur answers)
 * - Moyenne pondérée (weighted_avg_score)
 * - Note globale = arrondi entier de la moyenne
 */


export function downloadEvaluationPdf(evaluation: Evaluation) {
  const tokens = api.getTokens()
  

  if (!tokens?.access) {
    alert("Vous devez être connecté")
    return
  }
  
  fetch(`/dashboard/evaluations/${evaluation.id}/telecharger`, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Erreur téléchargement")
      return res.blob()
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Notation de ${evaluation.evaluated.matricule} - ${evaluation.form.title}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    })
    .catch((e) => {
      console.error(e)
      alert("Impossible de télécharger le PDF")
    })
}



export function EvaluationsReceivedTable({ form }: { form: Form }) {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationNotee[]>([]);

  useEffect(() => {
    (async () => {
      if (!form) return;
      const datas = await api.get<EvaluationNotee[]>(
        `/api/forms/${form.id}/evaluations/received/`,
      );
      setEvaluations(datas);
    })();
  }, [form]);

  // Rien à afficher
  if (!evaluations?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
        <Eye className="h-6 w-6 opacity-50" />
        <p className="text-sm font-medium">Aucune notation reçue</p>
        <p className="text-xs">
          Les résultats apparaîtront ici une fois que des collègues vous auront
          noté.
        </p>
      </div>
    );
  }

  if (!evaluations?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Les agents qui vous ont notés</CardTitle>
          <CardDescription>
            Les notations que vous avez reçues lors du trimestre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Aucune notation reçue.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Les agents qui vous ont notés</CardTitle>
        <CardDescription>
          Les notations que vous avez reçues lors du trimestre
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary">
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
                const firstName = eva.evaluation.evaluator?.first_name ?? "";
                const lastName = eva.evaluation.evaluator?.last_name ?? "";
                const matricule = eva.evaluation.evaluator?.matricule ?? "";

                const completion = eva.completion_pct;
                const avgLabel =
                  typeof eva.weighted_avg_score === "number"
                    ? eva.weighted_avg_score?.toFixed(2)
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
                        href={`/dashboard/evaluations/${eva.evaluation.id}/view`}
                        className="mr-3"
                      >
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>

                      <Button onClick={() => downloadEvaluationPdf(eva.evaluation)} variant="ghost" size="sm">
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
      </CardContent>
    </Card>
  );
}
