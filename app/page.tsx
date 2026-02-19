"use client";

import { useAuth } from "@/lib/actions/auth-context"
import { redirect } from "next/navigation"

export default function HomePage() {
  const { user } = useAuth()
  redirect("/dashboard")
}
