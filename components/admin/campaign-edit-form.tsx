"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateCampaign } from "@/lib/actions/campaigns"
import type { Question, Form } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CampaignEditFormProps {
  form: Form
  questions: Question[]
  selectedQuestionIds: string[]
}

type Quarter = "T1" | "T2" | "T3" | "T4"

const QUARTERS: { value: Quarter; label: string }[] = [
  { value: "T1", label: "Trimestre 1 (T1)" },
  { value: "T2", label: "Trimestre 2 (T2)" },
  { value: "T3", label: "Trimestre 3 (T3)" },
  { value: "T4", label: "Trimestre 4 (T4)" },
]

function parseYearAndQuarterFromTitleOrPeriod(form: Form): { year: number; quarter: Quarter } {
  // 1) Si period est déjà "T1..T4"
  if (["T1", "T2", "T3", "T4"].includes(form.period as string)) {
    // Essayer d'extraire l'année depuis le title: "Trimestre T1 2026"
    const m = (form.title ?? "").match(/(\d{4})/)
    const year = m ? Number(m[1]) : new Date().getFullYear()
    return { year, quarter: form.period as Quarter }
  }

  // 2) Si period est "2026-T1" (ancien format possible)
  const p = (form.period ?? "").match(/^(\d{4})-(T[1-4])$/)
  if (p) {
    return { year: Number(p[1]), quarter: p[2] as Quarter }
  }

  // 3) fallback
  const m = (form.title ?? "").match(/(T[1-4]).*(\d{4})|(\d{4}).*(T[1-4])/)
  const year = m ? Number(m[2] ?? m[3]) : new Date().getFullYear()
  const quarter = (m ? (m[1] ?? m[4]) : "T1") as Quarter
  return { year, quarter }
}

function buildTitle(year: number, quarter: Quarter) {
  return `Trimestre ${year}-${quarter}`
}

export function CampaignEditForm({ form, questions, selectedQuestionIds }: CampaignEditFormProps) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const yearOptions = useMemo(() => [currentYear, currentYear + 1, currentYear + 2, currentYear + 3], [currentYear])

  const initial = useMemo(() => parseYearAndQuarterFromTitleOrPeriod(form), [form])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState(() => ({
    year: initial.year,
    quarter: initial.quarter,
    isActive: form.is_active,
    selectedQuestions: selectedQuestionIds as string[],
  }))

  const title = useMemo(() => buildTitle(formData.year, formData.quarter), [formData.year, formData.quarter])
  const period = useMemo(() => formData.quarter, [formData.quarter]) // demandé: period = trimestre

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

    const result = await updateCampaign({
      formId: form.id,
      title, // concat année + trimestre
      period, // trimestre uniquement (T1..T4)
      isActive: formData.isActive,
      questionIds: formData.selectedQuestions,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.href = `/admin/campaigns/${form.id}`
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

        {/* Aperçu du titre généré */}
        {/* <div className="rounded-lg border border-border p-3 text-sm">
          <div className="flex flex-col gap-1">
            <div>
              <span className="text-muted-foreground">Titre généré :</span>{" "}
              <span className="font-medium">{title}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Période enregistrée :</span>{" "}
              <span className="font-medium">{period}</span>
            </div>
          </div>
        </div> */}

        {/* Actif */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            disabled={loading}
          />
          <Label htmlFor="isActive" className="font-normal cursor-pointer">
            Trimestre actif
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
          <AlertDescription>Notation modifiée avec succès ! Redirection...</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = `/admin/campaigns/${form.id}`)}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer les modifications"
          )}
        </Button>
      </div>
    </form>
  )
}
