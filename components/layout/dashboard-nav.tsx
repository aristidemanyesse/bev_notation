"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  LayoutGrid,
  HelpCircle,
  LucideEdit,
  FileLock,
  Eye,
} from "lucide-react"

interface DashboardNavProps {
  role: "ADMIN" | "AGENT"
  user: {
    first_name?: string | null
    last_name?: string | null
    matricule?: string | null
  }
}

export function DashboardNav({ role, user }: DashboardNavProps) {
  
  const pathname = usePathname()

  const agentLinks = [
    {
      href: "/dashboard",
      label: "Tableau de bord",
      icon: LayoutGrid,
    },
    {
      href: "/dashboard/noter",
      label: role == 'ADMIN' ? 'Noter un agent' : 'Noter un collègue',
      icon: LucideEdit,
    },
    {
      href: "/dashboard/notations",
      label: role == 'ADMIN' ? 'Consulter les notes' : "Consulter mes notes",
      icon: Eye,
    },
    {
      href: "/dashboard/compte/mot-de-passe",
      label: "Changer mot de passe",
      icon: FileLock,
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
      label: "Trimestres",
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
  ]

  const renderLinks = (links: typeof agentLinks) =>
    links.map((link) => {
      const Icon = link.icon
      const isActive =
        pathname === link.href ||
        pathname.startsWith(link.href + "/") ||
        (link.href === "/admin" && pathname.startsWith("/admin"))

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
    })

  return (
    <nav className="w-64 border-r border-border bg-card p-4 flex flex-col">
      {/* AGENT */}
      <div className="space-y-1 h-15">
        <h1 className="px-3 text-md font-semibold">{user.first_name} {user.last_name}</h1>
        <p className="px-3 text-xs text-muted-foreground">{user.matricule || role}</p>
      </div>

      {/* AGENT */}
      <div className="space-y-1 h-60">
        <div className="my-4 border-t border-border" />
        <p className="px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">
          Tous
        </p>
        {renderLinks(agentLinks)}
      </div>

      {/* ADMIN */}
      {role === "ADMIN" && (
        <>
          <div className="my-4 border-t border-border" />
          <div className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">
              Administration
            </p>
            {renderLinks(adminLinks)}
          </div>
        </>
      )}
    </nav>
  )
}
