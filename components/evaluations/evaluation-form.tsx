"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
  Question,
  Answer,
  FormQuestion,
  Evaluation,
  Form,
} from "@/lib/types/database";
import { submitEvaluation } from "@/lib/actions/evaluations";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api/api";

export function EvaluationForm({ evaluation }: { evaluation: Evaluation }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitted = !!evaluation.submitted_at;
  const [answers, setAnswers] = useState<
    Record<string, { score: number; comment: string }>
  >({});
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([]);
  // 3) Empêcher de réinitialiser si l'utilisateur a commencé à modifier
  const isDirtyRef = useRef(false);

  // 2) State principal

  useEffect(() => {
    if (isDirtyRef.current) return;
    (async () => {
      let datas = await api.get<Answer[]>(
        `/api/evaluations/${evaluation.id}/answers`,
      );
      setAnswers(
        datas.reduce(
          (acc, a) => {
            acc[a.question.id] = { score: a.score, comment: a.comment || "" };
            return acc;
          },
          {} as Record<string, { score: number; comment: string }>,
        ),
      );

      let dts = await api.get<FormQuestion[]>(
        `/api/evaluations/${evaluation.id}/questions`,
      );
      setFormQuestions(dts);
    })();
  }, [evaluation]);


  const handleScoreChange = (questionId: string, score: number) => {
    isDirtyRef.current = true;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { score, comment: prev[questionId]?.comment || "" },
    }));
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    isDirtyRef.current = true;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { score: prev[questionId]?.score ?? 3, comment },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Validate all questions have answers
    const unanswered = formQuestions.filter(
      (fq) => !answers[fq.question.id]?.score,
    );
    if (unanswered.length > 0) {
      setError("Veuillez répondre à toutes les questions avant de soumettre.");
      setLoading(false);
      return;
    }

    const result = await submitEvaluation(evaluation.id, answers);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/dashboard/noter?campaignId=${evaluation.form.id}`);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {isSubmitted  && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Cette évaluation a déjà été soumise.
          </AlertDescription>
        </Alert>
      )}

      {formQuestions.map((fq, index) => (
        <Card key={fq.question.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Question {index + 1} : {fq.question.label}
            </CardTitle>
            {fq.question.description && (
              <CardDescription>{fq.question.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <RadioGroup
                value={answers[fq.question.id]?.score?.toString() || ""}
                onValueChange={(value) =>
                  handleScoreChange(fq.question.id, Number.parseInt(value))
                }
                disabled={loading}
              >
                <div className="flex gap-6">
                  {[1, 2, 3, 4].map((score) => (
                    <div key={score} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={score.toString()}
                        id={`${fq.question.id}-${score}`}
                      />
                      <Label
                        htmlFor={`${fq.question.id}-${score}`}
                        className="font-normal cursor-pointer"
                      >
                        {score}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <br></br>
            <div className="space-y-2">
              <Textarea
                id={`comment-${fq.question.id}`}
                placeholder="Ajoutez un commentaire ici (optionnel)..."
                value={answers[fq.question.id]?.comment || ""}
                onChange={(e) =>
                  handleCommentChange(fq.question.id, e.target.value)
                }
                disabled={loading}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button variant="secondary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Envoi en cours..." : "Envoyer les notes"}
        </Button>
      </div>
    </div>
  );
}
