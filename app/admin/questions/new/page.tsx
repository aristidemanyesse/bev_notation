import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { QuestionForm } from "@/components/admin/question-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

function FormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default async function NewQuestionPage() {
  const user = await getCurrentUser()

  if (!user || user.role?.code !== "ADMIN") {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()
  const { data: categories } = await supabase.from("question_categories").select("*").order("label")

  return (
    <DashboardShell role="ADMIN" user={user}>
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Créer une nouvelle question</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Ajouter une nouvelle question d'évaluation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails de la question</CardTitle>
            <CardDescription>Configurez les paramètres de la question</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormLoader />}>
              <QuestionForm categories={categories || []} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
