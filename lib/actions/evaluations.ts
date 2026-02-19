"use client"

import { api } from "../api/api";

export async function submitEvaluation(
  evaluationId: string,
  answers: Record<string, { score: number; comment: string }>
) {
  
  try {
    // 1️⃣ Upsert des réponses (PAS de delete)
    const answersData = Object.entries(answers).map(
      ([questionId, answer]) => ({
        evaluation_id: evaluationId,
        question_id: questionId,
        score: answer.score,
        comment: answer.comment || null,
      })
    )

    console.log("ANSWERS DATA:", answersData)

    try {
      await api.post(`/api/answers/bulk-upsert/`, { answers: answersData })
    } catch (e) {
      console.error("ANSWERS ERROR:", e)
      return { error: "Echec lors de l'enregistrement des réponses" }
    }

    try {
      await api.post(`/api/evaluations/${evaluationId}/submit/`, {})
      // ou PATCH /api/evaluations/:id { submitted_at: ... }
    } catch (e) {
      console.error("EVAL ERROR:", e)
      return { error: "Echec lors de la soumission de l'évaluation" }
    }

    return { success: true }
  } catch (error) {
    console.error("SUBMIT ERROR:", error)
    return { error: "Une erreur inattendue s'est produite" }
  }
}
