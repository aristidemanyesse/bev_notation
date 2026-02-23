"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { Agent, LoginResponse, Role } from "../types/database"
import { api, ApiError } from "../api/api"

export interface AuthContextType {
  user: Agent | null
  isAuthenticated: boolean
  isLoading: boolean
  mustChangePassword: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  setMockRole: (role: Role) => void
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapUserMeToUser(userMe: Agent): Agent {
  return {
    id: userMe.id,
    first_name: userMe.first_name,
    last_name: userMe.last_name,
    email: userMe.email,
    username: userMe.username,
    matricule: userMe.matricule,
    role: userMe.role,
    created_at: userMe.created_at,
    is_active: userMe.is_active,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Agent | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  const fetchUser = useCallback(async (): Promise<Agent | null> => {
    try {
      const userMe = await api.get<Agent>("/api/auth/me/")
      const mappedUser = mapUserMeToUser(userMe)
      setUser(mappedUser)
      setIsAuthenticated(true)
      return mappedUser
    } catch {
      api.clearTokens()
      setUser(null)
      setIsAuthenticated(false)
      setMustChangePassword(false)
      return null
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const tokens = api.getTokens()
      if (tokens?.access) {
        await fetchUser()
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [fetchUser])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const loginResponse = await api.post<LoginResponse>(
        "/api/auth/token/",
        { username, password },
        { skipAuth: true },
      )

      api.setTokens({
        access: loginResponse.access,
        refresh: loginResponse.refresh,
      })

      const userMe = await api.get<Agent>("/api/auth/me/")
      const mappedUser = mapUserMeToUser(userMe)
      setUser(mappedUser)
      setIsAuthenticated(true)
      // setMustChangePassword(mappedUser.must_change_password)
      return true
    } catch (error) {
      api.clearTokens()
      setUser(null)
      setIsAuthenticated(false)
      setMustChangePassword(false)

      if (error instanceof ApiError) {
        throw error
      }
      throw new Error("Une erreur est survenue lors de la connexion")
    }
  }, [])

  const logout = useCallback(() => {
    api.clearTokens()
    setUser(null)
    setIsAuthenticated(false)
    setMustChangePassword(false)
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }, [])

  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  const setMockRole = useCallback((role : Role) => {
    setIsAuthenticated(true)
    setMustChangePassword(false)
  }, [])


return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        mustChangePassword,
        login,
        logout,
        refreshUser,
        setMockRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  console.log(context)
  const user = context.user
  return context as AuthContextType
}