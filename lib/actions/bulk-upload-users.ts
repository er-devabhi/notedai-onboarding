'use server'

import { revalidatePath } from 'next/cache'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { userRoles } from '@/lib/validations'

export interface BulkUserRecord {
  rowNumber: number
  name: string
  email: string
  role: string
  password: string
}

export interface BulkUserResultRow {
  rowNumber: number
  name: string
  email: string
  role: string
  status: 'success' | 'failed'
  error?: string
  // Plaintext password used for successfully-created users (provided in the
  // CSV or derived from email). Only present on success rows.
  password?: string
}

export interface BulkUserUploadResponse {
  results: BulkUserResultRow[]
  totalSuccess: number
  totalFailed: number
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function derivePasswordFromEmail(email: string): string {
  const localPart = email.split('@')[0] || ''
  const prefix = localPart.split('.')[0] || localPart
  return `${prefix.toLowerCase()}#1234`
}

export async function bulkUploadUsers(
  outletId: number,
  restaurantId: number,
  records: BulkUserRecord[]
): Promise<BulkUserUploadResponse> {
  const results: BulkUserResultRow[] = []
  const seenEmails = new Set<string>()

  // Pre-fetch existing emails so duplicates are reported as failed.
  const candidateEmails = records
    .map((r) => r.email.trim().toLowerCase())
    .filter(Boolean)
  const existing = candidateEmails.length
    ? await prisma.users.findMany({
        where: { email: { in: candidateEmails } },
        select: { email: true },
      })
    : []
  const existingEmails = new Set(
    existing.map((u) => u.email?.toLowerCase()).filter(Boolean)
  )

  for (const record of records) {
    const base = {
      rowNumber: record.rowNumber,
      name: record.name,
      email: record.email,
      role: record.role,
    }

    const name = record.name.trim()
    const email = record.email.trim().toLowerCase()
    // Role is optional: blank -> GRE, otherwise the provided value is used.
    const providedRole = record.role.trim()
    const role = providedRole ? providedRole.toUpperCase() : 'GRE'

    // ── Per-row validation ──
    if (!name) {
      results.push({ ...base, status: 'failed', error: 'Name is required' })
      continue
    }
    if (!email) {
      results.push({ ...base, status: 'failed', error: 'Email is required' })
      continue
    }
    if (!emailRegex.test(email)) {
      results.push({ ...base, status: 'failed', error: 'Invalid email format' })
      continue
    }
    if (!(userRoles as readonly string[]).includes(role)) {
      results.push({
        ...base,
        status: 'failed',
        error: `Invalid role "${record.role}". Allowed: ${userRoles.join(', ')}`,
      })
      continue
    }

    // Password: use provided (min 6), otherwise derive from email.
    let password = record.password?.trim() || ''
    if (!password) {
      password = derivePasswordFromEmail(email)
    } else if (password.length < 6) {
      results.push({
        ...base,
        status: 'failed',
        error: 'Password must be at least 6 characters',
      })
      continue
    }

    // Duplicate within the file
    if (seenEmails.has(email)) {
      results.push({
        ...base,
        status: 'failed',
        error: 'Duplicate email in file',
      })
      continue
    }
    // Already registered in DB
    if (existingEmails.has(email)) {
      results.push({
        ...base,
        status: 'failed',
        error: 'Email already registered',
      })
      continue
    }

    seenEmails.add(email)

    try {
      const hashedPassword = await hashPassword(password)
      await prisma.users.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as UserRole,
          outlet_id: outletId,
          restaurant_id: restaurantId,
        },
      })
      results.push({ ...base, status: 'success', password })
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        results.push({
          ...base,
          status: 'failed',
          error: 'Email already registered',
        })
      } else {
        console.error('[bulk-upload-users] Failed to create user:', err)
        results.push({
          ...base,
          status: 'failed',
          error: 'Failed to create user',
        })
      }
    }
  }

  revalidatePath(`/outlets/${outletId}`)

  return {
    results,
    totalSuccess: results.filter((r) => r.status === 'success').length,
    totalFailed: results.filter((r) => r.status === 'failed').length,
  }
}
