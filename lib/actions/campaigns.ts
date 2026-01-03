"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CreateCampaignData {
  title: string
  period: string
  isActive: boolean
  questionIds: string[]
  createdBy: string
  agentIds: string[]
}

export async function createCampaign(data: CreateCampaignData) {
  try {
    const supabase = await getSupabaseServerClient()

    // Create form
    const { data: form, error: formError } = await supabase
      .from("forms")
      .insert({
        title: data.title,
        period: data.period,
        is_active: data.isActive,
        created_by: data.createdBy,
      })
      .select()
      .single()

    if (formError || !form) {
      return { error: "Failed to create campaign" }
    }

    // Add questions to form
    const formQuestions = data.questionIds.map((questionId, index) => ({
      form_id: form.id,
      question_id: questionId,
      position: index + 1,
    }))

    const { error: questionsError } = await supabase.from("form_questions").insert(formQuestions)

    if (questionsError) {
      return { error: "Failed to add questions to campaign" }
    }

    // Create evaluations (A evaluates B, A ≠ B)
    const evaluations = []
    for (const evaluatorId of data.agentIds) {
      for (const evaluatedId of data.agentIds) {
        if (evaluatorId !== evaluatedId) {
          evaluations.push({
            form_id: form.id,
            evaluator_id: evaluatorId,
            evaluated_id: evaluatedId,
          })
        }
      }
    }

    const { error: evaluationsError } = await supabase.from("evaluations").insert(evaluations)

    if (evaluationsError) {
      return { error: "Failed to create evaluations" }
    }

    revalidatePath("/admin/campaigns")
    return { success: true, formId: form.id }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

export async function toggleCampaignStatus(formId: string, isActive: boolean) {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("forms").update({ is_active: isActive }).eq("id", formId)

    if (error) {
      return { error: "Failed to update campaign status" }
    }

    revalidatePath("/admin/campaigns")
    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}
