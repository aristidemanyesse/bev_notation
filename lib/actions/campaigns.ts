"use server"

import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { supabaseAdminClient } from "@/lib/supabase/adminClient"
import { revalidatePath } from "next/cache"


interface CreateCampaignData {
  title: string
  period: string
  isActive: boolean
  questionIds: string[]
  createdBy: string
  agentIds: string[]
}

interface UpdateCampaignData {
  formId: string
  title: string
  period: string
  isActive: boolean
  questionIds: string[]
}

export async function createCampaign(data: CreateCampaignData) {
  try {
    const supabase = await supabaseAdminClient

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

    if (formError) {
      console.error("[v0] Erreur lors de la création de la campagne", formError)
      return { error: formError.message }
    }
    if (!form) {
      return { error: "Erreur lors de la création de la campagne" }
    }

    // Add questions to form
    const formQuestions = data.questionIds.map((questionId, index) => ({
      form_id: form.id,
      question_id: questionId,
      position: index + 1,
    }))

    const { error: questionsError } = await supabase.from("form_questions").insert(formQuestions)

    if (questionsError) {
      return { error: "Erreur lors de l'ajout des questions" }
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
      return { error: "Erreur lors de la création des évaluations" }
    }

    revalidatePath("/admin/campaigns")
    return { success: true, formId: form.id }
  } catch (error) {
    console.log("[v0] Erreur lors de la création d'une campagne", error)
    return { error: "Une erreur inattendue s'est produite" }
  }
}



export async function updateCampaign(data: UpdateCampaignData) {
  try {
    const supabase = await supabaseAdminClient

    // 1️⃣ Mise à jour des infos du formulaire
    const { error: formError } = await supabase
      .from("forms")
      .update({
        title: data.title,
        period: data.period,
        is_active: data.isActive,
      })
      .eq("id", data.formId)

    if (formError) {
      return { error: "Échec de la mise à jour de la campagne" }
    }

    // 2️⃣ Nettoyer les doublons dans questionIds
    const uniqueQuestionIds = Array.from(new Set(data.questionIds))

    // 3️⃣ Récupérer les questions existantes du formulaire
    const { data: existingQuestions, error: fetchError } = await supabase
      .from("form_questions")
      .select("question_id, position")
      .eq("form_id", data.formId)

    if (fetchError) {
      return { error: "Échec de la récupération des questions existantes" }
    }

    const existingIds = existingQuestions?.map(q => q.question_id) || []

    // 4️⃣ Calculer les ajouts et suppressions
    const toAdd = uniqueQuestionIds.filter(id => !existingIds.includes(id))
    const toRemove = existingIds.filter(id => !uniqueQuestionIds.includes(id))

    // 5️⃣ Supprimer uniquement les questions retirées
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("form_questions")
        .delete()
        .eq("form_id", data.formId)
        .in("question_id", toRemove)
      if (deleteError) {
        return { error: "Échec de la suppression des anciennes questions" }
      }
    }

    // 6️⃣ Ajouter les nouvelles questions
    if (toAdd.length > 0) {
      const newQuestions = toAdd.map((id) => ({
        form_id: data.formId,
        question_id: id,
        position: uniqueQuestionIds.indexOf(id) + 1,
      }))
      const { error: insertError } = await supabase.from("form_questions").insert(newQuestions)
      if (insertError) {
        return { error: "Échec de l'ajout des nouvelles questions" }
      }
    }

    // 7️⃣ Mettre à jour la position des questions existantes si nécessaire
    for (const q of existingQuestions) {
      const newPosition = uniqueQuestionIds.indexOf(q.question_id) + 1
      if (q.position !== newPosition) {
        await supabase
          .from("form_questions")
          .update({ position: newPosition })
          .eq("form_id", data.formId)
          .eq("question_id", q.question_id)
      }
    }

    // 8️⃣ Revalidation
    revalidatePath("/admin/campaigns")
    revalidatePath(`/admin/campaigns/${data.formId}`)

    return { success: true }
  } catch (error) {
    console.error("[updateCampaign] Error:", error)
    return { error: "Une erreur inattendue s'est produite" }
  }
}


export async function toggleCampaignStatus(formId: string, isActive: boolean) {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("forms").update({ is_active: isActive }).eq("id", formId)

    if (error) {
      return { error: "Échec de la mise à jour du statut de la campagne" }
    }

    revalidatePath("/admin/campaigns")
    return { success: true }
  } catch (error) {
    return { error: "Une erreur inattendue s'est produite" }
  }
}
