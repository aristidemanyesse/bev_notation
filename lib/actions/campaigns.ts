"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { api } from "@/lib/api/api"

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

export async function createCampaign(router: AppRouterInstance, data: CreateCampaignData) {
  try {
    // 1) Create form
    const form = await api.post<{ id: string }>(`/api/forms/`, {
      title: data.title,
      period: data.period,
      is_active: data.isActive,
      created_by: data.createdBy,
    })

    // 2) Set questions (positions auto)
    const uniqueQuestionIds = Array.from(new Set(data.questionIds))
    await api.put(`/api/forms/${form.id}/questions/`, { question_ids: uniqueQuestionIds })

    router.push(`/admin/campaigns/${form.id}`)
    return { success: true, formId: form.id }
  } catch (error: any) {
    const msg = String(error?.message || "")
    // si ton backend renvoie un code/slug d'erreur "duplicate"
    if (msg.toLowerCase().includes("duplicate") || msg.includes("23505")) {
      return { error: "Une campagne existe déjà pour ce trimestre et cette année." }
    }
    return { error: msg || "Une erreur inattendue s'est produite" }
  }
}



export async function updateCampaign(
  router: AppRouterInstance,
  data: UpdateCampaignData
) {
  try {
    await api.patch(`/api/forms/${data.formId}/`, {
      title: data.title,
      period: data.period,
      is_active: data.isActive,
    })

    const uniqueQuestionIds = Array.from(new Set(data.questionIds))
    await api.put(`/api/forms/${data.formId}/questions/`, {
      question_ids: uniqueQuestionIds,
    })

    router.push(`/admin/campaigns/${data.formId}`)
    router.refresh()
    return { success: true }
  } catch (error: any) {
    return { error: String(error?.message || "Une erreur inattendue s'est produite") }
  }
}


export async function toggleCampaignStatus(router: AppRouterInstance, formId: string, isActive: boolean) {
  try {
    await api.patch(`/api/forms/${formId}/`, { is_active: isActive })

    router.push(`/admin/campaigns/`)
    return { success: true }
  } catch (error: any) {
    return { error: String(error?.message || "Une erreur inattendue s'est produite") }
  }
}
