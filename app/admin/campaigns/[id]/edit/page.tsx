import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect, notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CampaignEditForm } from "@/components/admin/campaign-edit-form"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { supabaseAdminClient } from "@/lib/supabase/adminClient"

function FormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.role?.code !== "ADMIN") {
    redirect("/login")
  }

  const supabase = supabaseAdminClient

  const { data: form } = await supabase.from("forms").select("*").eq("id", id).maybeSingle()

  if (!form) {
    notFound()
  }

  const { data: formQuestions } = await supabase
    .from("form_questions")
    .select("question_id")
    .eq("form_id", id)
    .order("position")

  const selectedQuestionIds = formQuestions?.map((fq) => fq.question_id) || []

  const { data: questions } = await supabase.from("questions").select("*").eq("is_active", true).order("label")

  return (
    <DashboardShell role="ADMIN" user={user}>
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Modifier la notation</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Mettre à jour les paramètres de la notation du trimestre</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails du trimestre</CardTitle>
            <CardDescription>Modifiez les informations de la notation du trimestre</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormLoader />}>
              <CampaignEditForm form={form} questions={questions || []} selectedQuestionIds={selectedQuestionIds} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
