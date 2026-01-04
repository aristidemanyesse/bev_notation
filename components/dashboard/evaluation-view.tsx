"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import type { Question, Answer } from "@/lib/types/database"
import { Badge } from "lucide-react"

interface EvaluationViewProps {
  questions: Question[]
  answers: Answer[]
}

export function EvaluationView({ questions, answers }: EvaluationViewProps) {
  // On mappe les réponses par question pour plus de facilité
  const answersMap: Record<string, Answer> = {}
  answers.forEach((ans) => {
    answersMap[ans.question_id] = ans
  })

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const answer = answersMap[question.id]
        return (
          <Card key={question.id}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">
                            Question {index + 1} : {question.label}
                        </CardTitle>
                        {question.description && <CardDescription>{question.description}</CardDescription>}
                    </div>
                    <Label className="text-3xl">{answer?.score ?? "Non noté"}</Label>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-muted-foreground">
                  {answer?.comment || "Aucun commentaire"}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
