"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Form } from "@/lib/types/database"

export function CampaignSelect({
  campaigns,
  selectedCampaign,
  onSelect = (campaign: Form) => {},
}: {
  campaigns: Form[]
  selectedCampaign: Form | null
  onSelect?: (campaign: Form) => void
}) {
  const router = useRouter()

  return (
    <Select
      value={selectedCampaign?.id}
      onValueChange={(value) => onSelect(campaigns.find((c) => c.id === value)!)}
    >
      <SelectTrigger className="w-[320px]">
        <SelectValue placeholder="Sélectionner un trimestre" />
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
