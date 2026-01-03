"use server"

import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CreateAgentData {
  email: string
  password: string
  matricule: string
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
  roleId: string
  isActive: boolean
}

export async function createAgent(data: CreateAgentData) {
  try {
    const supabaseAdmin = await getSupabaseAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })

    if (authError || !user) {
      return { error: "Erreur lors de la création de l'utilisateur: " + (authError?.message || "Utilisateur non créé") }
    }

    const { error: agentError } = await supabaseAdmin.from("agents").insert({
      id: user.id,
      matricule: data.matricule,
      first_name: data.firstName,
      last_name: data.lastName,
      role_id: data.roleId,
      is_active: data.isActive,
    })

    if (agentError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return { error: "Erreur lors de la création de l'agent: " + agentError.message }
    }

    revalidatePath("/admin/agents")
    return { success: true }
  } catch (error) {
    return { error: "Une erreur inattendue s'est produite" }
  }
}

export async function updateAgent(data: UpdateAgentData) {
  try {
    const supabaseAdmin = await getSupabaseAdminClient()

    const { error } = await supabaseAdmin
      .from("agents")
      .update({
        matricule: data.matricule,
        first_name: data.firstName,
        last_name: data.lastName,
        role_id: data.roleId,
        is_active: data.isActive,
      })
      .eq("id", data.id)

    if (error) {
      return { error: "Erreur lors de la mise à jour de l'agent: " + error.message }
    }

    revalidatePath("/admin/agents")
    return { success: true }
  } catch (error) {
    return { error: "Une erreur inattendue s'est produite" }
  }
}

export async function deleteAgent(agentId: string) {
  try {
    const supabaseAdmin = await getSupabaseAdminClient()

    // Supprimer l'agent de la table
    const { error: agentError } = await supabaseAdmin.from("agents").delete().eq("id", agentId)

    if (agentError) {
      return { error: "Erreur lors de la suppression de l'agent" }
    }

    // Supprimer l'utilisateur Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(agentId)

    if (authError) {
      console.error("[v0] Erreur suppression auth user:", authError)
    }

    revalidatePath("/admin/agents")
    return { success: true }
  } catch (error) {
    return { error: "Une erreur inattendue s'est produite" }
  }
}
