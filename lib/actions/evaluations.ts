"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitEvaluation(
  evaluationId: string,
  answers: Record<string, { score: number; comment: string }>,
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Delete existing answers
    await supabase.from("answers").delete().eq("evaluation_id", evaluationId)

    // Insert new answers
    const answersData = Object.entries(answers).map(([questionId, answer]) => ({
      evaluation_id: evaluationId,
      question_id: questionId,
      score: answer.score,
      comment: answer.comment || null,
    }))

    const { error: answersError } = await supabase.from("answers").insert(answersData)

    if (answersError) {
      return { error: "Failed to save answers" }
    }

    // Mark evaluation as submitted
    const { error: evalError } = await supabase
      .from("evaluations")
      .update({ submitted_at: new Date().toISOString() })
      .eq("id", evaluationId)

    if (evalError) {
      return { error: "Failed to submit evaluation" }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}
