// Client-side wrapper around this repo's own /api/qr-logins routes, which
// proxy to the app backend server-side (see lib/qr-backend.ts). The browser
// never sees the backend URL or the internal API key -- it only talks to
// this app's own origin, authenticated by the existing admin_session cookie.

export type QrLoginStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED'

export interface QrLogin {
  id: string
  label: string
  userId: string
  userName: string | null
  userEmail: string | null
  status: QrLoginStatus
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

export interface QrLoginWithUrl extends QrLogin {
  url: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in body && body.error) ||
      `Request failed with status ${res.status}`
    throw new Error(String(message))
  }

  return body as T
}

export function createQrLogin(input: {
  userId: string
  outletId: number
  label: string
  expiresInSeconds?: number
}): Promise<QrLoginWithUrl> {
  return request<QrLoginWithUrl>('/api/qr-logins', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function listQrLogins(outletId: number): Promise<QrLogin[]> {
  return request<QrLogin[]>(`/api/qr-logins?outletId=${outletId}`)
}

export function revokeQrLogin(id: string): Promise<QrLogin> {
  return request<QrLogin>(`/api/qr-logins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'revoke' }),
  })
}

export function reinitiateQrLogin(
  id: string,
  expiresInSeconds?: number
): Promise<QrLoginWithUrl> {
  return request<QrLoginWithUrl>(`/api/qr-logins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'reinitiate', expiresInSeconds }),
  })
}
