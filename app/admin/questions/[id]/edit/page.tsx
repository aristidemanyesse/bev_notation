import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QuestionForm } from "@/components/admin/question-form"

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.role?.code !== "ADMIN") {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  const { data: categories } = await supabase.from("question_categories").select("*").order("label")

  const { data: question } = await supabase
    .from("questions")
    .select("*, category:question_categories(*)")
    .eq("id", id)
    .single()

  if (!question) {
    redirect("/admin/questions")
  }

  return (
    <DashboardShell role="ADMIN" user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Modifier une question</h2>
          <p className="text-muted-foreground">Mettre à jour les informations de la question</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails de la question</CardTitle>
            <CardDescription>Modifiez les paramètres de la question</CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionForm categories={categories || []} question={question} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
