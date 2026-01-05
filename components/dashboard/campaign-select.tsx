"use client"

import { useRouter } from "next/navigation"
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

  return (
    <Select
      value={selectedCampaignId}
      onValueChange={(value) => {
        router.push(`/dashboard?campaignId=${value}`)
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
