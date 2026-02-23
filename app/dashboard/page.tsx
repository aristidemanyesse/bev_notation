"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CampaignSelect } from "@/components/dashboard/campaign-select";
import { api } from "@/lib/api/api";
import { useAuth } from "@/lib/actions/auth-context";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardSummary, Evaluation, Form } from "@/lib/types/database";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText, TrendingUp, Users } from "lucide-react";
import { Progress } from "@radix-ui/react-progress";
import { PageLoading } from "@/components/ui/page-loading";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const { user } = useAuth();
  console.log("User in DashboardPage:", user);

  const [activeCampaigns, setActiveCampaigns] = useState<Form[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Form | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const datas = await api.get<Form[]>(
          "/api/forms/?is_active=true&ordering=-created_at",
        );
        if (cancelled) return;

        setActiveCampaigns(datas);

        const params = await searchParams; // si c'est une Promise chez toi
        const id = params.campaignId ?? datas[0]?.id;

        const next = datas.find((c) => c.id === id) ?? null;
        setSelectedCampaign(next);
      } catch (e) {
        setLoading(false);
        console.error("[v0] Erreur récupération campagnes actives", e);
        toast({
          title: "Erreur",
          description: "Erreur récupération des campagnes actives",
          variant: "destructive",
        });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // ✅ IMPORTANT: PAS de selectedCampaign en deps
  }, [searchParams]);

  useEffect(() => {
    if (!selectedCampaign) return;

    let cancelled = false;

    (async () => {
        try {
        const response = await api.get<DashboardSummary>(
          `/api/forms/${selectedCampaign?.id}/my_dashboard/`,
        );
        if (!cancelled) setSummary(response);
      } catch {
        setLoading(false);
        toast({
          title: "Erreur",
          description: "Erreur récupération des stats de ta campagne",
          variant: "destructive",
        });
      }
      setLoading(false);
    })();

    return () => { cancelled = true };

    // ✅ IMPORTANT: PAS de selectedCampaign en deps
  }, [selectedCampaign]);


  if (loading) {
    return (
      <PageLoading
        title="Ouverture de la campagne"
        description="Chargement du formulaire et des questions…"
      />
    );
  }

    // Calculate totals



  return (
    <DashboardShell role={user?.role?.code as "ADMIN" | "AGENT"} user={user!}>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight ">
              Tableau de bord du {selectedCampaign?.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedCampaign
                ? selectedCampaign.period
                : "Aucune notation active"}
            </p>
          </div>

          <CampaignSelect
            campaigns={activeCampaigns} // ✅ cohérent
            selectedCampaign={selectedCampaign ?? null}
            onSelect={(campaign) => {
              setSelectedCampaign(campaign);
            }}
          />
        </div>

        <p className="h-5"> </p>

        {selectedCampaign && summary && (
          <div className="grid gap-10 sm:grid-cols-3 grid-flow-row auto-rows-max">
            <div className="col-span-1">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    Note globale
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-center h-55">
                  <div className="h-6"> </div>
                  <div className="text-9xl font-bold">
                    {summary.weighted_score
                      ? summary.weighted_score.toFixed()
                      : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedCampaign?.title}</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 col-span-2 sm:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-secondary">
                    Moyenne
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary.weighted_score
                      ? summary.weighted_score.toFixed(2)
                      : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Totaux des notes affectés des coefficients</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nombre {user!.role?.code == "ADMIN" ? "d'agents" : "de collègues"} qui m'ont notés</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total_given} / {summary.total_to_given}</div>
                  <p className="text-xs text-muted-foreground">Ceux qui vous ont notés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nombre {user?.role?.code == "ADMIN" ? "d'agents" : "de collègues"} que j'ai noté</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary.total_completed}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summary.completion_rate}% de Taux de complétion
                  </p>
                  <Progress value={summary.completion_rate} className="mt-2 h-1" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nombre {user?.role?.code == "ADMIN" ? "d'agents" : "de collègues"} restants que je dois noter</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary.total_pending}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Notations à terminer
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
