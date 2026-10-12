import { NextResponse } from 'next/server'

// Temporary diagnostic route to confirm which env vars actually reach
// process.env at runtime on Amplify. Reports presence only, never values.
// Remove once the Amplify env var injection issue is resolved.
export async function GET() {
  const secretsRaw = process.env.secrets
  let secretsParsed: { present: boolean; parsed: boolean; keys: string[] } = {
    present: Boolean(secretsRaw),
    parsed: false,
    keys: [],
  }
  if (secretsRaw) {
    try {
      const obj = JSON.parse(secretsRaw) as Record<string, unknown>
      secretsParsed = { present: true, parsed: true, keys: Object.keys(obj) }
    } catch {
      // present but not valid JSON
    }
  }

  return NextResponse.json({
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_DATABASE_URL: Boolean(process.env.DIRECT_DATABASE_URL),
    QR_BACKEND_URL: Boolean(process.env.QR_BACKEND_URL),
    QR_INTERNAL_API_KEY: Boolean(process.env.QR_INTERNAL_API_KEY),
    NODE_ENV: process.env.NODE_ENV ?? null,
    secrets: secretsParsed,
  })
}
