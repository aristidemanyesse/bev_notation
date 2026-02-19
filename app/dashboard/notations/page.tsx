"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell"

import type { Evaluation, Form } from "@/lib/types/database"
import { EvaluationsReceivedTable } from "@/components/dashboard/evaluations-received-table"
import { CampaignSelect } from "@/components/dashboard/campaign-select"
import { useAuth } from "@/lib/actions/auth-context"
import { api } from "@/lib/api/api"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"

export default function NotationsPage({searchParams}: {searchParams: Promise<{ campaignId?: string }>}) {
  const {user} = useAuth();

  const [activeCampaigns, setActiveCampaigns] = useState<Form[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Form | null>(
    null,
  );
  const [receivedEvaluations, setReceivedEvaluations] = useState<Evaluation[]>([]);

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
        console.error("[v0] Erreur récupération campagnes actives", e);
      }
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
        const datas = await api.get<Evaluation[]>(
          `/api/forms/${selectedCampaign.id}/evaluations/received/`,
        );
        if (!cancelled) setReceivedEvaluations(datas);
      } catch {
        toast({
          title: "Erreur",
          description: "Erreur récupération des évaluations en attente",
          variant: "destructive",
        });
      }

    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCampaign?.id]); // ✅ dépend uniquement de l'id


  return (
    <DashboardShell role={user?.role?.code as "ADMIN" | "AGENT"} user={user!}>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Mes notes du {selectedCampaign?.title}</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedCampaign
                ? selectedCampaign.period
                : "Aucune notation active"}
            </p>
          </div>
          <CampaignSelect
            campaigns = {activeCampaigns}
            selectedCampaign={selectedCampaign}
          />
        </div>
        <p className="h-5"> </p>

        <div className="grid gap-6 ">

          <EvaluationsReceivedTable
              form = {selectedCampaign!}
            />

        </div>

      </div>
    </DashboardShell>
  )
}
