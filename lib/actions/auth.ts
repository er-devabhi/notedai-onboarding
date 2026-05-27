'use server'

import { redirect } from 'next/navigation'
import { createSession, clearSession } from '@/lib/auth/session'
import { loginSchema } from '@/lib/validations'

export type AuthActionState = {
  error?: string
  success?: boolean
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawData = {
    password: formData.get('password') as string,
  }

  // Validate input
  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid input' }
  }

  // Check against environment variable
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error('[v0] ADMIN_PASSWORD environment variable is not set')
    return { error: 'Authentication not configured' }
  }

  if (parsed.data.password !== adminPassword) {
    // Do NOT log the attempted password
    return { error: 'Invalid password' }
  }

  // Create session
  await createSession()

  // Get redirect URL from form data or default to /setup
  const redirectTo = (formData.get('redirect') as string) || '/setup'
  redirect(redirectTo)
}

export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect('/login')
}
