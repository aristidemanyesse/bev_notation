"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CreateQuestionData {
  label: string
  description: string | null
  weight: number
  categoryId: string | null
  isActive: boolean
}

interface UpdateQuestionData extends CreateQuestionData {
  id: string
}

export async function createQuestion(data: CreateQuestionData) {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("questions").insert({
      label: data.label,
      description: data.description,
      weight: data.weight,
      category_id: data.categoryId,
      is_active: data.isActive,
    })

    if (error) {
      console.error("[v0] Erreur création question:", error)
      return { error: "Erreur lors de la création de la question" }
    }

    console.log("[v0] Question créée avec succès")
    revalidatePath("/admin/questions")
    return { success: true }
  } catch (error) {
    console.error("[v0] Erreur inattendue:", error)
    return { error: "Une erreur inattendue s'est produite" }
  }
}

export async function updateQuestion(data: UpdateQuestionData) {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from("questions")
      .update({
        label: data.label,
        description: data.description,
        weight: data.weight,
        category_id: data.categoryId,
        is_active: data.isActive,
      })
      .eq("id", data.id)

    if (error) {
      return { error: "Erreur lors de la mise à jour de la question" }
    }

    revalidatePath("/admin/questions")
    return { success: true }
  } catch (error) {
    return { error: "Une erreur inattendue s'est produite" }
  }
}

export async function deleteQuestion(questionId: string) {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("questions").delete().eq("id", questionId)

    if (error) {
      return { error: "Erreur lors de la suppression de la question" }
    }

    revalidatePath("/admin/questions")
    return { success: true }
  } catch (error) {
    return { error: "Une erreur inattendue s'est produite" }
  }
}
