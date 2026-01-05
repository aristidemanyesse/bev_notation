import { logout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface DashboardHeaderProps {
  role: "ADMIN" | "AGENT"
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex justify-center">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Plateforme de notation - BEV</h1>
            <p className="text-xs text-muted-foreground">
              {role === "ADMIN" ? "Tableau de bord administrateur" : "Tableau de bord agent"}
            </p>
          </div>
        </div>
        <form action={logout}>
          <Button variant="ghost" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </form>
      </div>
    </header>
  )
}
