"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toggleCampaignStatus } from "@/lib/actions/campaigns"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface CampaignStatusToggleProps {
  formId: string
  isActive: boolean
}

export function CampaignStatusToggle({ formId, isActive }: CampaignStatusToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    await toggleCampaignStatus(formId, checked)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch id="campaign-status" checked={isActive} onCheckedChange={handleToggle} disabled={loading} />
      <Label htmlFor="campaign-status" className="font-normal cursor-pointer">
        {isActive ? "La campagne est active" : "La campagne est inactive"}
      </Label>
    </div>
  )
}
