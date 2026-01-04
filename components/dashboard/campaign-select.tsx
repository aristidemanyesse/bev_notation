"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Campaign = {
  id: string
  title: string
  period: string
}

export function CampaignSelect({
  campaigns,
  selectedCampaignId,
}: {
  campaigns: Campaign[] | null
  selectedCampaignId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <Select
      value={selectedCampaignId}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("campaignId", value)
        router.push(`/dashboard?${params.toString()}`)
      }}
    >
      <SelectTrigger className="w-[320px]">
        <SelectValue placeholder="Sélectionner une campagne" />
      </SelectTrigger>

      <SelectContent>
        {campaigns?.map((campaign) => (
          <SelectItem key={campaign.id} value={campaign.id}>
            {campaign.title} ({campaign.period})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
