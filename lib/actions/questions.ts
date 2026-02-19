"use client"

import { api } from "../api/api"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

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

export async function createQuestion(router: AppRouterInstance, data: CreateQuestionData) {
  try {
    await api.post("/api/questions/", {
      label: data.label,
      description: data.description,
      weight: data.weight,
      category_id: data.categoryId,
      is_active: data.isActive,
    })

    router.push("/admin/questions")
    return { success: true }
  } catch (e: any) {
    return { error: String(e?.message || "Erreur lors de la création de la question") }
  }
}

export async function updateQuestion(router: AppRouterInstance, data: UpdateQuestionData) {
  try {
    await api.patch(`/api/questions/${data.id}/`, {
      label: data.label,
      description: data.description,
      weight: data.weight,
      category_id: data.categoryId,
      is_active: data.isActive,
    })

    router.push("/admin/questions")
    return { success: true }
  } catch (e: any) {
    return { error: String(e?.message || "Erreur lors de la mise à jour de la question") }
  }
}

export async function deleteQuestion(router: AppRouterInstance, questionId: string) {
  try {
    await api.delete(`/api/questions/${questionId}/`)

    router.push("/admin/questions")
    return { success: true }
  } catch (e: any) {
    return { error: String(e?.message || "Erreur lors de la suppression de la question") }
  }
}
