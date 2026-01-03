import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function EvaluationsPage() {
  const user = await getCurrentUser()

  if (!user || user.role?.code !== "AGENT") {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  const { data: activeForm } = await supabase.from("forms").select("*").eq("is_active", true).single()

  return (
    <DashboardShell role="AGENT">
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
