// ─── Centralised API client ───────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL ?? 'https://elitebullhood-backend.onrender.com/api'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// ── Client API (uses apex_token + auto-refresh) ───────────────────────────────
async function request<T>(method: Method, path: string, body?: unknown, isFormData = false): Promise<T> {
  const token = localStorage.getItem('apex_token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  })

  // Auto-refresh token on 401
  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) return request<T>(method, path, body, isFormData)
    localStorage.removeItem('apex_token')
    localStorage.removeItem('apex_refresh')
    window.dispatchEvent(new Event('apex:logout'))
  }

  // Handle banned account — redirect to /banned page
  if (res.status === 403) {
    const data = await res.json()
    if (data.banned) {
      localStorage.removeItem('apex_token')
      localStorage.removeItem('apex_refresh')
      window.location.href = '/banned'
      throw new Error(data.message ?? 'Account banned')
    }
    if (!data.success) throw new Error(data.message ?? 'Forbidden')
    return data as T
  }

  const data = await res.json()
  if (!data.success) throw new Error(data.message ?? 'Request failed')
  return data as T
}

async function tryRefresh(): Promise<boolean> {
  const refresh = localStorage.getItem('apex_refresh')
  if (!refresh) return false
  try {
    const res  = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('apex_token', data.data.accessToken)
      return true
    }
  } catch {}
  return false
}

export const api = {
  get:    <T>(path: string)                           => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)            => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown)            => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown)            => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                           => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData)           => request<T>('POST',   path, form, true),
}

// ── Admin API (uses apex_admin_token, kicks to /admin/login on 401) ───────────
async function adminRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('apex_admin_token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('apex_admin_token')
    localStorage.removeItem('apex_admin_session')
    window.location.href = '/admin/login'
    throw new Error('Admin session expired.')
  }

  const data = await res.json()
  if (!data.success) throw new Error(data.message ?? 'Request failed')
  return data as T
}

export const adminApi = {
  get:    <T>(path: string)                => adminRequest<T>('GET',    path),
  post:   <T>(path: string, body: unknown) => adminRequest<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown) => adminRequest<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown) => adminRequest<T>('PATCH',  path, body),
  delete: <T>(path: string)                => adminRequest<T>('DELETE', path),
}
