import bcrypt from 'bcryptjs'

// Salt rounds must match existing backend for compatibility
const SALT_ROUNDS = 10

/**
 * Hash a password using bcrypt
 * Compatible with existing backend password storage
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS)
}

/**
 * Verify a plaintext password against a hash
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash)
}
