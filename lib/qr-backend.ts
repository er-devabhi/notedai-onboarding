import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

// Server-only helper: forwards QR admin requests to the app backend with the
// internal API key attached. The key never reaches the browser -- the
// browser calls this repo's own /api/qr-logins routes (guarded by the
// existing admin_session cookie), and this module makes the outbound call.

function getBackendUrl(): string {
  const base = process.env.QR_BACKEND_URL
  if (!base) {
    throw new Error(
      'QR_BACKEND_URL is not configured. Set it to the base URL of the app backend.'
    )
  }
  return base.replace(/\/$/, '')
}

function getInternalApiKey(): string {
  const key = process.env.QR_INTERNAL_API_KEY
  if (!key) {
    throw new Error(
      'QR_INTERNAL_API_KEY is not configured. Set it to the internal API key the backend expects.'
    )
  }
  return key
}

export async function requireAdminSession(): Promise<NextResponse | null> {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function forwardToBackend(
  path: string,
  init?: RequestInit
): Promise<NextResponse> {
  const res = await fetch(`${getBackendUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': getInternalApiKey(),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })

  const body = await res.json().catch(() => null)
  return NextResponse.json(body, { status: res.status })
}
