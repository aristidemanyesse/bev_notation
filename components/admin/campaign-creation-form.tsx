"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createCampaign } from "@/lib/actions/campaigns"
import type { Question, Agent } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface CampaignCreationFormProps {
  questions: Question[]
  agents: Agent[]
  createdBy: string
}

export function CampaignCreationForm({ questions, agents, createdBy }: CampaignCreationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    period: "",
    isActive: false,
    selectedQuestions: [] as string[],
  })

  const handleQuestionToggle = (questionId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedQuestions: prev.selectedQuestions.includes(questionId)
        ? prev.selectedQuestions.filter((id) => id !== questionId)
        : [...prev.selectedQuestions, questionId],
    }))
  }

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
      title: formData.title,
      period: formData.period,
      isActive: formData.isActive,
      questionIds: formData.selectedQuestions,
      createdBy,
      agentIds: agents.map((a) => a.id),
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
        <div className="space-y-2">
          <Label htmlFor="title">Titre de la notation</Label>
          <Input
            id="title"
            placeholder="Évaluation Q1 2025"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="period">Période</Label>
          <Input
            id="period"
            placeholder="2025-T1"
            value={formData.period}
            onChange={(e) => setFormData((prev) => ({ ...prev, period: e.target.value }))}
            required
            disabled={loading}
          />
        </div>

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
            "Créer la notation"
          )}
        </Button>
      </div>
    </form>
  )
}
