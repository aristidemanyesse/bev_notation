"use client"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { ChangePasswordForm } from "@/components/dashboard/change-password-form"
import { use } from "react"
import { useAuth } from "@/lib/actions/auth-context"

export default function ChangePasswordPage() {
  const { user } = useAuth()

  return (
    <DashboardShell role={user?.role?.code as "ADMIN" | "AGENT"} user={user!}>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Changer mon mot de passe
            </h2>
          </div>
        </div>

        <div className="grid gap-6">
          <ChangePasswordForm />
        </div>
      </div>
    </DashboardShell>
  )
}
