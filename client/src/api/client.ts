const base = import.meta.env.VITE_API_URL ?? ''

export type ApiError = { error: string }

function getToken() {
  return localStorage.getItem('phimhay_token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('phimhay_token', token)
  else localStorage.removeItem('phimhay_token')
}

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let body = init?.body
  if (init?.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(init.json)
  }
  const res = await fetch(`${base}${path}`, { ...init, headers, body })
  const text = await res.text()
  const data = text ? (JSON.parse(text) as T & ApiError) : ({} as T)
  if (!res.ok) {
    const err = (data as ApiError).error || res.statusText || 'Lỗi mạng'
    throw new Error(err)
  }
  return data as T
}
