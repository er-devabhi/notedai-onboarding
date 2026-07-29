import { NextRequest } from 'next/server'
import { requireAdminSession, forwardToBackend } from '@/lib/qr-backend'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.text()
  return forwardToBackend(`/api/qr-logins/${id}`, {
    method: 'PATCH',
    body,
  })
}
