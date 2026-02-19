// API Client with automatic token refresh and Authorization header
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

interface TokenPair {
  access: string
  refresh: string
}

// Token storage helpers
function getTokens(): TokenPair | null {
  if (typeof window === "undefined") return null
  const access = localStorage.getItem("access_token")
  const refresh = localStorage.getItem("refresh_token")
  if (access && refresh) {
    return { access, refresh }
  }
  return null
}

function setTokens(tokens: TokenPair): void {
  localStorage.setItem("access_token", tokens.access)
  localStorage.setItem("refresh_token", tokens.refresh)
}

function clearTokens(): void {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  const tokens = getTokens()
  if (!tokens?.refresh) {
    return false
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: tokens.refresh }),
      })

      if (!response.ok) {
        clearTokens()
        return false
      }

      const data = await response.json()
      setTokens({
        access: data.access,
        refresh: data.refresh || tokens.refresh,
      })
      return true
    } catch {
      clearTokens()
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options

  const makeRequest = async (retry = false): Promise<T> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    }

    if (!skipAuth) {
      const tokens = getTokens()
      if (tokens?.access) {
        ;(headers as Record<string, string>)["Authorization"] = `Bearer ${tokens.access}`
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (response.status === 401 && !skipAuth && !retry) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return makeRequest(true)
      } else {
        clearTokens()
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        throw new Error("Session expirée. Veuillez vous reconnecter.")
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.detail || errorData.message || `Erreur ${response.status}`,
        response.status,
        errorData,
      )
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  return makeRequest()
}

export class ApiError extends Error {
  status: number
  data: Record<string, unknown>

  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

async function uploadMultipart<T>(endpoint: string, formData: FormData): Promise<T> {
  const tokens = getTokens()
  const headers: HeadersInit = {}

  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  })

  if (response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const newTokens = getTokens()
      if (newTokens?.access) {
        headers["Authorization"] = `Bearer ${newTokens.access}`
      }
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}))
        throw new ApiError(
          errorData.detail || errorData.message || `Erreur ${retryResponse.status}`,
          retryResponse.status,
          errorData,
        )
      }

      return retryResponse.json()
    } else {
      clearTokens()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new Error("Session expirée. Veuillez vous reconnecter.")
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(errorData.detail || errorData.message || `Erreur ${response.status}`, response.status, errorData)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

function apiGet<T>(endpoint: string, options?: ApiRequestOptions) {
  return apiRequest<T>(endpoint, { ...options, method: "GET" })
}

function apiPost<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  })
}

function apiPut<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  })
}

function apiPatch<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  })
}

function apiDelete<T>(endpoint: string, options?: ApiRequestOptions) {
  return apiRequest<T>(endpoint, { ...options, method: "DELETE" })
}

export const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
  uploadMultipart,
  setTokens,
  clearTokens,
  getTokens,
}
