"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { use } from "react"
import { useAuth } from "@/lib/actions/auth-context"

export default function SettingsPage() {
const { user } = useAuth()

  return (
    <DashboardShell role="ADMIN" user={user!}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Paramètres</h2>
          <p className="text-muted-foreground">Gérer les paramètres et la configuration de la plateforme</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Paramètres de la plateforme</CardTitle>
            <CardDescription>Configurer les paramètres de la plateforme de notation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Les options de paramètres apparaîtront ici.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
