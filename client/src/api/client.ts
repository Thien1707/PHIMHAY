const base = (import.meta.env.VITE_API_URL ?? '').trim()

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
  let data = {} as T & ApiError
  if (text) {
    try {
      data = JSON.parse(text) as T & ApiError
    } catch {
      data = { error: text } as T & ApiError
    }
  }
  if (!res.ok) {
    const err = (data as ApiError).error || res.statusText || 'Lỗi mạng'
    throw new Error(err)
  }
  return data as T
}

// Watch History APIs
export type WatchHistoryItem = {
  _id: string
  userId: string
  movieId: {
    _id: string
    title: string
    slug: string
    posterUrl: string
    thumbUrl: string
  }
  episode: number
  currentTime: number
  createdAt: string
  updatedAt: string
}

export async function updateWatchHistory(movieId: string, episode: number, currentTime: number) {
  return api('/api/history', {
    method: 'POST',
    json: { movieId, episode, currentTime }
  })
}

export async function getWatchHistory() {
  return api<WatchHistoryItem[]>('/api/history')
}

export async function deleteWatchHistoryItem(historyId: string) {
  return api(`/api/history/${historyId}`, { method: 'DELETE' })
}

export async function clearAllWatchHistory() {
  return api('/api/history', { method: 'DELETE' })
}
