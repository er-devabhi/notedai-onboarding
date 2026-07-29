import { NextRequest } from 'next/server'
import { requireAdminSession, forwardToBackend } from '@/lib/qr-backend'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  const outletId = request.nextUrl.searchParams.get('outletId')
  return forwardToBackend(`/api/qr-logins?outletId=${outletId}`, {
    method: 'GET',
  })
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  const body = await request.text()
  return forwardToBackend('/api/qr-logins', {
    method: 'POST',
    body,
  })
}
