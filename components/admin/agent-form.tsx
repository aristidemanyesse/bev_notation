"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAgent, updateAgent } from "@/lib/actions/agents";
import type { Role, Agent } from "@/lib/types/database";
import { Loader2 } from "lucide-react";

interface AgentFormProps {
  roles: Role[];
  agent?: Agent & { role: Role };
  mode?: "create" | "edit";
}

export function AgentForm({ roles, agent, mode = "create" }: AgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: agent?.id || "",
    password: "",
    username: agent?.username || "",
    matricule: agent?.matricule || "",
    firstName: agent?.first_name || "",
    lastName: agent?.last_name || "",
    roleId: agent?.role_id || "",
    isActive: agent?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let result;
    if (mode === "edit" && agent) {
      result = await updateAgent({
        id: agent.id,
        matricule: formData.matricule,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
        isActive: formData.isActive,
      });
    } else {
      result = await createAgent(formData);
    }

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/admin/agents";
      }, 1000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {mode === "edit" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Les informations de connexion ne peuvent pas être modifiées
            </p>
          </div>
        ) : (
          <div className="">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule</Label>
                <Input
                  id="matricule"
                  placeholder="AGT001"
                  value={formData.matricule}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      matricule: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifiant">Identifiant</Label>
                <Input
                  id="identifiant"
                  placeholder="Dupont"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                />
              </div>
            </div><br></br>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe (min. 6 caractères)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mot de passe (min. 6 caractères)"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}<br></br>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              placeholder="Jean"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              placeholder="Dupont"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rôle</Label>
          <Select
            value={formData.roleId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, roleId: value }))
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, isActive: checked }))
            }
            disabled={loading}
          />
          <Label htmlFor="isActive" className="font-normal cursor-pointer">
            Agent actif
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
            Agent {mode === "edit" ? "mis à jour" : "créé"} avec succès !
            Redirection...
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
            "Créer l'agent"
          )}
        </Button>
      </div>
    </form>
  );
}
