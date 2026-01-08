"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const identifiant = formData.get("identifiant") as string
  const password = formData.get("password") as string
  const fakeEmail = `${identifiant}@internal.local` as string

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password,
  })

  if (error) {
    console.error("[v0] Erreur lors de la connexion", error)
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function logout() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: agent } = await supabase.from("agents").select("*, role:roles(*)").eq("id", user.id).single()

  return agent
}
