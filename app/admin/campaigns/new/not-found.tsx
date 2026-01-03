import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <DashboardShell role="ADMIN">
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Campagne non trouvée</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">La campagne que vous recherchez n'existe pas ou a été supprimée.</p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/campaigns">Retour aux campagnes</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin">Tableau de bord</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
