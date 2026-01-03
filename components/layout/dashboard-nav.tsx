"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, FileText, Settings, HelpCircle } from "lucide-react"

interface DashboardNavProps {
  role: "ADMIN" | "AGENT"
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname()

  const agentLinks = [
    {
      href: "/dashboard",
      label: "Vue d'ensemble",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/evaluations",
      label: "Évaluations",
      icon: FileText,
    },
  ]

  const adminLinks = [
    {
      href: "/admin",
      label: "Vue d'ensemble",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/campaigns",
      label: "Campagnes",
      icon: FileText,
    },
    {
      href: "/admin/agents",
      label: "Agents",
      icon: Users,
    },
    {
      href: "/admin/questions",
      label: "Questions",
      icon: HelpCircle,
    },
    {
      href: "/admin/settings",
      label: "Paramètres",
      icon: Settings,
    },
  ]

  const links = role === "ADMIN" ? adminLinks : agentLinks

  return (
    <nav className="w-64 border-r border-border bg-card p-4">
      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
