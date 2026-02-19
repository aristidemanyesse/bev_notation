"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminCampaignAgentStats, Form } from "@/lib/types/database";
import { ArrowUpDown, HardDriveDownload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/api";
import Link from "next/link";
import { ca } from "date-fns/locale";


type SortField = "name" | "score" | "completion";

export function AgentPerformanceTable({ campaign }: { campaign: Form }) {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [agentsStats, setAgentsStats] = useState<AdminCampaignAgentStats[]>([]);

  useEffect(() => {
    (async () => {
      if (!campaign) return;
      const datas = await api.get<AdminCampaignAgentStats[]>(
        `/api/agents/stats/${campaign.id}/`,
      );
      setAgentsStats(datas);
    })();
  }, [campaign]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  async function downloadFinalRecap(formId: string, agentId: string) {
    const tokens = api.getTokens();
    if (!tokens?.access) throw new Error("Non authentifié");

    const url = `/admin/campaigns/${formId}/agents/${agentId}/telecharger`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokens.access}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Erreur téléchargement ${res.status} ${txt}`);
    }

    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bulletin_final_${formId}_${agentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance des agents</CardTitle>
        <CardDescription>
          Scores individuels et Taux de complétion des notations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("name")}
                  className="h-8 px-2"
                >
                  Agent
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Matricule</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("score")}
                  className="h-8 px-2"
                >
                  Moyenne
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("score")}
                  className="h-8 px-2"
                >
                  Note globale
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>L'ayant noté</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("completion")}
                  className="h-8 px-2"
                >
                 Qu'il a noté
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentsStats.map((stat) => {
              const hasScore =
                stat.global_score !== null && stat.global_score !== undefined;
              const scoreColor = hasScore
                ? stat.global_score >= 4
                  ? "text-green-600 dark:text-green-400"
                  : stat.global_score >= 3
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                : "";

              return (
                <TableRow key={stat.agent.id}>
                  <TableCell className="font-medium">
                    {stat.agent.first_name} {stat.agent.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{stat.agent.matricule}</Badge>
                  </TableCell>
                  <TableCell className={scoreColor}>
                    {hasScore ? stat.global_score : "N/A"}
                  </TableCell>
                  <TableCell className={scoreColor}>
                    {hasScore ? stat.global_score.toFixed() : "N/A"}
                  </TableCell>
                  <TableCell>{stat.evaluations_received}</TableCell>
                  <TableCell>{stat.evaluations_done}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadFinalRecap(stat.form.id, stat.agent.id).catch(
                          console.error,
                        );
                      }}
                    >
                      <HardDriveDownload className="h-4 w-4 mr-1" />
                      Bulletin final
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
