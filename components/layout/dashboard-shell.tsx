import type { ReactNode } from "react"
import { DashboardHeader } from "./dashboard-header"
import { DashboardNav } from "./dashboard-nav"

interface DashboardShellProps {
  children: ReactNode
  role: "ADMIN" | "AGENT"
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader role={role} />
      <div className="flex">
        <DashboardNav role={role} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
