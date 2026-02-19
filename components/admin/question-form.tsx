"use client"

import type React from "react"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createQuestion, updateQuestion } from "@/lib/actions/questions"
import type { QuestionCategory, Question } from "@/lib/types/database"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuestionFormProps {
  categories: QuestionCategory[]
  question?: Question & { category: QuestionCategory | null }
  mode?: "create" | "edit"
}

export function QuestionForm({ categories, question, mode = "create" }: QuestionFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    label: question?.label || "",
    description: question?.description || "",
    weight: question?.weight?.toString() || "1",
    categoryId: question?.category?.id || "",
    isActive: question?.is_active ?? true,
  })

  useEffect(() => {
    if (question) {
      setFormData({
        label: question.label || "",
        description: question.description || "",
        weight: question.weight?.toString() || "1",
        categoryId: question.category?.id || "",
        isActive: question.is_active ?? true,
      })
    }
  }, [question])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const questionData = {
      label: formData.label,
      description: formData.description || null,
      weight: Number.parseInt(formData.weight),
      categoryId: formData.categoryId || null,
      isActive: formData.isActive,
    }

    let result
    if (mode === "edit" && question) {
      result = await updateQuestion(router, {
        ...questionData,
        id: question.id,
      })
    } else {
      result = await createQuestion(router, questionData)
    }

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.href = "/admin/questions"
      }, 1000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Question</Label>
          <Input
            id="label"
            placeholder="Ex: Maîtrise des outils techniques"
            value={formData.label}
            onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optionnel)</Label>
          <Textarea
            id="description"
            placeholder="Description détaillée de la question..."
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            disabled={loading}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Poids</Label>
          <Input
            id="weight"
            type="number"
            min="1"
            max="10"
            value={formData.weight}
            onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
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
            Question active
          </Label>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>
            Question {mode === "edit" ? "mise à jour" : "créée"} avec succès ! Redirection...
          </AlertDescription>
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
              {mode === "edit" ? "Mise à jour..." : "Création..."}
            </>
          ) : mode === "edit" ? (
            "Mettre à jour"
          ) : (
            "Créer la question"
          )}
        </Button>
      </div>
    </form>
  )
}
