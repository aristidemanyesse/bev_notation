"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import type { Question, Answer, FormQuestion } from "@/lib/types/database"
import { Badge } from "lucide-react"

interface EvaluationViewProps {
  questions: FormQuestion[]
  answers: Answer[]
}

export function EvaluationView({ questions, answers }: EvaluationViewProps) {
  // On mappe les réponses par question pour plus de facilité
  const answersMap: Record<string, Answer> = {}
  answers.forEach((ans) => {
    answersMap[ans.question.id] = ans
  })

  return (
    <div className="space-y-6">
      {questions?.map((fq, index) => {
        const answer = answersMap[fq.question.id]
        return (
          <Card key={fq.question.id}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">
                            Question {index + 1} : {fq.question.label}
                        </CardTitle>
                        {fq.question.description && <CardDescription>{fq.question.description}</CardDescription>}
                    </div>
                    <Label className="text-2xl">{answer?.score ?? "Non noté"}</Label>
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
