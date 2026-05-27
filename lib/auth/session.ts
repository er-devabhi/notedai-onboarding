import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * Create a simple admin session
 * For MVP: Just stores a token indicating authenticated status
 */
export async function createSession(): Promise<void> {
  const cookieStore = await cookies()
  
  // Simple token - in production, use a proper session ID
  const sessionToken = Buffer.from(
    JSON.stringify({
      authenticated: true,
      createdAt: Date.now(),
    })
  ).toString('base64')

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

/**
 * Check if user has a valid session
 */
export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return false
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    )
    
    // Check if session is still valid (within max age)
    const sessionAge = Date.now() - decoded.createdAt
    if (sessionAge > SESSION_MAX_AGE * 1000) {
      return false
    }

    return decoded.authenticated === true
  } catch {
    return false
  }
}

/**
 * Clear the session
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
