"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import {  useAuth } from "@/lib/actions/auth-context";
import type {
  Evaluation,
  Form,
} from "@/lib/types/database";
import { EvaluationsList } from "@/components/dashboard/evaluations-list";
import {
  Eye,
} from "lucide-react";
import { EvaluationsGivenTable } from "@/components/dashboard/evaluations-given-table";
import { CampaignSelect } from "@/components/dashboard/campaign-select";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/api";
import { toast } from "@/hooks/use-toast";

export default function NoterPage({
  searchParams,
}: {
  searchParams: Promise<{ formId?: string }>;
}) {
  const { user } = useAuth();

  const [activeCampaigns, setActiveCampaigns] = useState<Form[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Form | null>(
    null,
  );
  const [pendingEvaluations, setPendingEvaluations] = useState<Evaluation[]>([]);

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
        const id = params.formId ?? datas[0]?.id;

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
          `/api/forms/${selectedCampaign.id}/evaluations/pending/`,
        );
        if (!cancelled) setPendingEvaluations(datas);
      } catch {
        toast({
          title: "Erreur",
          description: "Erreur récupération des notations en attente",
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
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Noter un {user?.role?.code == "ADMIN" ? "collaborateur" : "collègue"}</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedCampaign
                ? selectedCampaign.title
                : "Aucune notation active"}
            </p>
          </div>
          <CampaignSelect
            campaigns={activeCampaigns}
            selectedCampaign={selectedCampaign ?? null}
          />
        </div>
        <p className="h-5"> </p>

        {pendingEvaluations && pendingEvaluations.length > 0 ? (
          <EvaluationsList evaluations={pendingEvaluations} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
            <Eye className="h-6 w-6 opacity-50" />
            <p className="text-sm">
              Aucune notation en attente pour ce trimestre.
            </p>
          </div>
        )}

        <div className="grid gap-6">
          <EvaluationsGivenTable form={selectedCampaign!} />
        </div>
      </div>
    </DashboardShell>
  );
}
