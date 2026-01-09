"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createCampaign } from "@/lib/actions/campaigns"
import type { Question, Agent } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CampaignCreationFormProps {
  questions: Question[]
  agents: Agent[]
  createdBy: string
}

type Quarter = "T1" | "T2" | "T3" | "T4"

const QUARTERS: { value: Quarter; label: string }[] = [
  { value: "T1", label: "Trimestre 1 (T1)" },
  { value: "T2", label: "Trimestre 2 (T2)" },
  { value: "T3", label: "Trimestre 3 (T3)" },
  { value: "T4", label: "Trimestre 4 (T4)" },
]

function buildTitle(year: number, quarter: Quarter) {
  return `Trimestre ${year}-${quarter}`
}

function buildPeriod(year: number, quarter: Quarter) {
  // format stable côté DB (tu peux garder "2025-T1" si tu préfères)
  return `${year}-${quarter}`
}

export function CampaignCreationForm({ questions, agents, createdBy }: CampaignCreationFormProps) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const yearOptions = useMemo(() => {
    // année -1, année, année +1
    return [currentYear - 1, currentYear, currentYear + 1]
  }, [currentYear])

  const defaultQuarter: Quarter = "T1"

  // Par défaut: actif + toutes les questions cochées
  const [formData, setFormData] = useState(() => ({
    year: currentYear,
    quarter: defaultQuarter,
    isActive: true,
    selectedQuestions: questions.map((q) => q.id) as string[],
  }))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const title = useMemo(() => buildTitle(formData.year, formData.quarter), [formData.year, formData.quarter])
  const period = useMemo(() => buildPeriod(formData.year, formData.quarter), [formData.year, formData.quarter])

  const handleQuestionToggle = (questionId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedQuestions: prev.selectedQuestions.includes(questionId)
        ? prev.selectedQuestions.filter((id) => id !== questionId)
        : [...prev.selectedQuestions, questionId],
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedQuestions: checked ? questions.map((q) => q.id) : [],
    }))
  }

  const allSelected = questions.length > 0 && formData.selectedQuestions.length === questions.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (formData.selectedQuestions.length === 0) {
      setError("Veuillez sélectionner au moins une question.")
      setLoading(false)
      return
    }

    const result = await createCampaign({
      title, // concat année + trimestre
      period: formData.quarter, // demandé: period = trimestre
      isActive: formData.isActive, // par défaut true
      questionIds: formData.selectedQuestions,
      createdBy,
      agentIds: agents.map((a) => a.id),
      // Si tu utilises aussi period "2025-T1" côté DB, remplace par: period
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.href = "/admin/campaigns"
      }, 1000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Année + Trimestre */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Année</Label>
            <Select
              value={String(formData.year)}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, year: Number(v) }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une année" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trimestre</Label>
            <Select
              value={formData.quarter}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, quarter: v as Quarter }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un trimestre" />
              </SelectTrigger>
              <SelectContent>
                {QUARTERS.map((q) => (
                  <SelectItem key={q.value} value={q.value}>
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Par défaut: actif */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            disabled={loading}
          />
          <Label htmlFor="isActive" className="font-normal cursor-pointer">
            Activer la notation immédiatement
          </Label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sélectionner les questions</CardTitle>
          <CardDescription>Choisissez les questions à inclure dans cette notation</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Select all */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={(v) => handleSelectAll(Boolean(v))}
                disabled={loading || questions.length === 0}
              />
              <Label htmlFor="select-all" className="cursor-pointer">
                Tout sélectionner
              </Label>
            </div>
            <div className="text-sm text-muted-foreground">
              {formData.selectedQuestions.length}/{questions.length} sélectionnées
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questions.length > 0 ? (
              questions.map((question) => (
                <div key={question.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border">
                  <Checkbox
                    id={`question-${question.id}`}
                    checked={formData.selectedQuestions.includes(question.id)}
                    onCheckedChange={() => handleQuestionToggle(question.id)}
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`question-${question.id}`} className="font-medium cursor-pointer">
                      {question.label}
                    </Label>
                    {question.description && (
                      <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">Aucune question disponible.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>Notation créée avec succès ! Redirection...</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création...
            </>
          ) : (
            "Créer"
          )}
        </Button>
      </div>
    </form>
  )
}
