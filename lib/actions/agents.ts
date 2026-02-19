"use client"

import { api } from "../api/api"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

interface CreateAgentData {
  email: string
  password: string
  matricule: string
  username: string
  firstName: string
  lastName: string
  roleId: string
  isActive: boolean
}

interface UpdateAgentData {
  id: string
  matricule: string
  firstName: string
  lastName: string
  username: string
  roleId: string
  isActive: boolean
}

export async function createAgent(router: AppRouterInstance, data: CreateAgentData) {
  try {
    await api.post("/api/admin/agents/", {
      email: data.email || `${data.username}@internal.local`,
      password: data.password,
      matricule: data.matricule,
      username: data.username,
      first_name: data.firstName,
      last_name: data.lastName,
      role_id: data.roleId,
      is_active: data.isActive,
    })

    router.push("/admin/agents")
    return { success: true }
  } catch (e: any) {
    return { error: String(e?.message || "Une erreur inattendue s'est produite") }
  }
}

export async function updateAgent(router: AppRouterInstance, data: UpdateAgentData) {
  try {
    await api.patch(`/api/agents/${data.id}/`, {
      matricule: data.matricule,
      username: data.username,
      first_name: data.firstName,
      last_name: data.lastName,
      role_id: data.roleId,
      is_active: data.isActive,
    })

    router.push("/admin/agents")
    return { success: true }
  } catch (e: any) {
    return { error: String(e?.message || "Une erreur inattendue s'est produite") }
  }
}

export async function deleteAgent(router: AppRouterInstance, agentId: string) {
  try {
    await api.delete(`/api/agents/${agentId}/`)

    router.push("/admin/agents")
    return { success: true }
  } catch (e: any) {
    return { error: String(e?.message || "Une erreur inattendue s'est produite") }
  }
}




export async function updatePassword(newPassword: string) {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return { error: "Utilisateur non authentifié." }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
