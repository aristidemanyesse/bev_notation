"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/actions/auth-context"
import { use, useEffect, useState } from "react"
import { api } from "@/lib/api/api"
import { Form } from "@/lib/types/database"


export default async function EvaluationsPage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [activeForm, setActiveForm] = useState<Form | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const e = await api.get<Form>(`/api/forms/active`)
        setActiveForm(e)

      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (!user) {
    return <div>Chargement…</div>
  }

  if (loading) {
    return (
      <DashboardShell role={user.role?.code as "ADMIN" | "AGENT"} user={user}>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Chargement…</h2>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role={user?.role?.code as "ADMIN" | "AGENT"} user={user!}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">My Evaluations</h2>
          <p className="text-muted-foreground">View and complete your evaluations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Evaluations</CardTitle>
            <CardDescription>
              {activeForm ? `Current campaign: ${activeForm.title}` : "No active campaign"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your evaluations will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
