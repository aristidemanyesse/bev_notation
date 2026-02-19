import { cookies } from "next/headers"
import { ApiError } from "./api" // ou duplique ApiError dans un fichier shared

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

type HeadersInitLike = Record<string, string>

async function getServerAccessToken(): Promise<string | null>  {
  // adapte les noms de cookies à ton backend
  const cookieStore = await cookies()
  return cookieStore.get("access_token")?.value ?? null
}

async function getServerRefreshToken(): Promise<string | null>  {
    const cookieStore = await cookies()
  return cookieStore.get("refresh_token")?.value ?? null
}

async function refreshServerAccessToken(): Promise<boolean> {
  const refresh = getServerRefreshToken()
  if (!refresh) return false

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  })

  if (!res.ok) return false

  const data = await res.json().catch(() => null)
  if (!data?.access) return false

  // stocker en cookies (server-side)
  const jar = await cookies()
  jar.set("access_token", data.access, { path: "/", sameSite: "lax" })
  if (data.refresh) {
    jar.set("refresh_token", data.refresh, { path: "/", sameSite: "lax" })
  }
  return true
}

export async function apiRequestServer<T>(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options

  const makeRequest = async (retry = false): Promise<T> => {
    const headers: HeadersInitLike = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as HeadersInitLike | undefined),
    }

    if (!skipAuth) {
      const access = getServerAccessToken()
      if (access) headers["Authorization"] = `Bearer ${access}`
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      cache: "no-store",
    })

    if (res.status === 401 && !skipAuth && !retry) {
      const refreshed = await refreshServerAccessToken()
      if (refreshed) return makeRequest(true)
      throw new Error("Session expirée. Veuillez vous reconnecter.")
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new ApiError(
        (errorData as any)?.detail || (errorData as any)?.message || `Erreur ${res.status}`,
        res.status,
        errorData as any
      )
    }

    if (res.status === 204) return {} as T
    return (await res.json()) as T
  }

  return makeRequest()
}

export const apiServer = {
  get: <T>(endpoint: string, options?: RequestInit & { skipAuth?: boolean }) =>
    apiRequestServer<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit & { skipAuth?: boolean }) =>
    apiRequestServer<T>(endpoint, { ...options, method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit & { skipAuth?: boolean }) =>
    apiRequestServer<T>(endpoint, { ...options, method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit & { skipAuth?: boolean }) =>
    apiRequestServer<T>(endpoint, { ...options, method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(endpoint: string, options?: RequestInit & { skipAuth?: boolean }) =>
    apiRequestServer<T>(endpoint, { ...options, method: "DELETE" }),
}
