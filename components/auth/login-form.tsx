"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/actions/auth-context"
import { toast } from "../ui/use-toast"
import { useRouter } from "next/navigation";
import { ApiError } from "next/dist/server/api-utils"


export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
       await login(username, password)
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans le système SGDBEV",
      })
      router.push("/")
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Identifiants incorrects"
      setError(message)
      toast({
        title: "Erreur de connexion",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full w-120 bg-background/95 backdrop-blur-md shadow-2xl border-orange-200">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-3xl font-bold text-orange-600 text-center">Espace de connexion</CardTitle>
        <CardDescription className="text-base text-center">
          Entrez vos identifiants pour accéder à la plateforme de notation
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="identifiant" className="text-base">
              Identifiant
            </Label>
            <Input
              id="identifiant"
              name="identifiant"
              type="text"
              placeholder="identifiant"
              required
              value = {username}
              disabled={loading}
              onChange= {(e) => setUsername(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">
              Mot de passe
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mot de passe"
              required
              value = {password}
              onChange= {(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-11 text-base"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
