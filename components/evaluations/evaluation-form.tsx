"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Question, Answer } from "@/lib/types/database"
import { submitEvaluation } from "@/lib/actions/evaluations"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

interface EvaluationFormProps {
  evaluationId: string
  formId: string
  questions: Question[]
  existingAnswers: Answer[]
  isSubmitted: boolean
}

export function EvaluationForm({ evaluationId, formId, questions, existingAnswers, isSubmitted }: EvaluationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [answers, setAnswers] = useState<Record<string, { score: number; comment: string }>>(() => {
    const initial: Record<string, { score: number; comment: string }> = {}
    existingAnswers.forEach((answer) => {
      initial[answer.question_id] = {
        score: answer.score,
        comment: answer.comment || "",
      }
    })
    return initial
  })

  const handleScoreChange = (questionId: string, score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        score,
        comment: prev[questionId]?.comment || "",
      },
    }))
  }

  const handleCommentChange = (questionId: string, comment: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        score: prev[questionId]?.score || 3,
        comment,
      },
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    // Validate all questions have answers
    const unanswered = questions.filter((q) => !answers[q.id] || !answers[q.id].score)
    if (unanswered.length > 0) {
      setError("Veuillez répondre à toutes les questions avant de soumettre.")
      setLoading(false)
      return
    }

    const result = await submitEvaluation(evaluationId, answers)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push(`/dashboard?campaignId=${formId}`)
      router.refresh()
    }
  }

  // if (isSubmitted) {
  //   return (
  //     <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
  //       <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
  //       <AlertDescription className="text-green-800 dark:text-green-200">
  //         Cette évaluation a déjà été soumise.
  //       </AlertDescription>
  //     </Alert>
  //   )
  // }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Question {index + 1} : {question.label}
            </CardTitle>
            {question.description && <CardDescription>{question.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <RadioGroup
                value={answers[question.id]?.score?.toString() || ""}
                onValueChange={(value) => handleScoreChange(question.id, Number.parseInt(value))}
                disabled={loading}
              >
                <div className="flex gap-6">
                  {[1, 2, 3, 4].map((score) => (
                    <div key={score} className="flex items-center space-x-2">
                      <RadioGroupItem value={score.toString()} id={`${question.id}-${score}`} />
                      <Label htmlFor={`${question.id}-${score}`} className="font-normal cursor-pointer">
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
                id={`comment-${question.id}`}
                placeholder="Ajoutez un commentaire ici (optionnel)..."
                value={answers[question.id]?.comment || ""}
                onChange={(e) => handleCommentChange(question.id, e.target.value)}
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
        <Button variant="outline" onClick={() => router.back()} disabled={loading}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Envoi en cours..." : "Soumettre l'évaluation"}
        </Button>
      </div>
    </div>
  )
}
