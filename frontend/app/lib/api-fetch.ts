import { clearAuth, getToken } from "./auth"
import { queryClient } from "./query-client"

export class ApiError extends Error {
  status: number
  response: Response

  constructor(status: number, message: string, response: Response) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.response = response
  }
}

export interface ApiFetchInit extends Omit<RequestInit, "body"> {
  body?: unknown
}

async function getErrorMessage(response: Response): Promise<string> {
  let message = response.statusText || `Request failed (${response.status})`
  try {
    const data = await response.clone().json()
    if (data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string") {
      message = (data as { message: string }).message
    }
  } catch {
    // body wasn't JSON - keep statusText
  }
  return message
}

export async function apiFetch<T>(input: string, init: ApiFetchInit = {}): Promise<T> {
  const { body, headers: initHeaders, method = "GET", ...rest } = init

  const headers = new Headers(initHeaders as HeadersInit | undefined)

  const token = getToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const requestInit: RequestInit = { ...rest, method, headers }

  if (body !== undefined && method.toUpperCase() !== "GET") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
    requestInit.body = JSON.stringify(body)
  }

  const response = await fetch(input, requestInit)

  if (response.status === 401) {
    const message = await getErrorMessage(response)
    clearAuth()
    queryClient.clear()
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login")
    }
    throw new ApiError(401, message, response)
  }

  if (!response.ok) {
    let message = response.statusText || `Request failed (${response.status})`
    try {
      const data = await response.clone().json()
      if (data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string") {
        message = (data as { message: string }).message
      }
    } catch {
      // body wasn't JSON — keep statusText
    }
    throw new ApiError(response.status, message, response)
  }

  if (response.status === 204) {
    return null as T
  }

  const text = await response.text()
  if (text.length === 0) {
    return null as T
  }

  return JSON.parse(text) as T
}
