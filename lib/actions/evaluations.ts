"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitEvaluation(
  evaluationId: string,
  answers: Record<string, { score: number; comment: string }>
) {
  try {
    const supabase = await getSupabaseServerClient()

    // 1️⃣ Upsert des réponses (PAS de delete)
    const answersData = Object.entries(answers).map(
      ([questionId, answer]) => ({
        evaluation_id: evaluationId,
        question_id: questionId,
        score: answer.score,
        comment: answer.comment || null,
      })
    )

    const { error: answersError } = await supabase
      .from("answers")
      .upsert(answersData, {
        onConflict: "evaluation_id,question_id",
      })

    if (answersError) {
      console.error("ANSWERS ERROR:", answersError)
      return { error: "Failed to save answers" }
    }

    // 2️⃣ Marquer l’évaluation comme soumise
    const { error: evalError } = await supabase
      .from("evaluations")
      .update({ submitted_at: new Date().toISOString() })
      .eq("id", evaluationId)

    if (evalError) {
      console.error("EVAL ERROR:", evalError)
      return { error: "Failed to submit evaluation" }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("SUBMIT ERROR:", error)
    return { error: "An unexpected error occurred" }
}
}
