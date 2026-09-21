'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { Prisma, UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import {
  outletDepartmentSchema,
  departmentConfigSchema,
  outletNotificationSettingsSchema,
  type OutletDepartmentInput,
  type DepartmentConfigInput,
  type OutletNotificationSettingsInput,
} from '@/lib/validations'
import type { ActionResult } from './organizations'

// ── Read ────────────────────────────────────────────────────────────────────

export async function getOutletDepartments(outletId: number) {
  return prisma.outlet_department.findMany({
    where: { outlet_id: outletId },
    orderBy: { name: 'asc' },
    include: {
      configs: {
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      },
      user_subscriptions: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  })
}

// ── Department CRUD ───────────────────────────────────────────────────────────

export async function createDepartment(
  outletId: number,
  data: OutletDepartmentInput
): Promise<ActionResult> {
  const parsed = outletDepartmentSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Invalid input',
    }
  }

  try {
    const department = await prisma.outlet_department.create({
      data: {
        outlet_id: outletId,
        name: parsed.data.name.trim(),
      },
    })

    revalidatePath(`/outlets/${outletId}`)
    return { success: true, data: department }
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: 'A department with this name already exists in this outlet',
      }
    }
    console.error('[departments] Error creating department:', error)
    return { success: false, error: 'Failed to create department' }
  }
}

export async function updateDepartment(
  id: number,
  data: OutletDepartmentInput
): Promise<ActionResult> {
  const parsed = outletDepartmentSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Invalid input',
    }
  }

  try {
    const department = await prisma.outlet_department.update({
      where: { id },
      data: { name: parsed.data.name.trim() },
    })

    revalidatePath(`/outlets/${department.outlet_id}`)
    return { success: true, data: department }
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: 'A department with this name already exists in this outlet',
      }
    }
    console.error('[departments] Error updating department:', error)
    return { success: false, error: 'Failed to update department' }
  }
}

export async function deleteDepartment(id: number): Promise<ActionResult> {
  try {
    const department = await prisma.outlet_department.findUnique({
      where: { id },
      select: { id: true, outlet_id: true },
    })

    if (!department) {
      return { success: false, error: 'Department not found' }
    }

    // department_config has no cascade delete in schema, so remove configs
    // first. user_department_subscription cascades automatically.
    await prisma.$transaction([
      prisma.department_config.deleteMany({
        where: { outlet_department_id: id },
      }),
      prisma.outlet_department.delete({ where: { id } }),
    ])

    revalidatePath(`/outlets/${department.outlet_id}`)
    return { success: true }
  } catch (error) {
    console.error('[departments] Error deleting department:', error)
    return { success: false, error: 'Failed to delete department' }
  }
}

// ── Department config (contact) CRUD ──────────────────────────────────────────

export async function createDepartmentConfig(
  departmentId: number,
  data: DepartmentConfigInput,
  existingUserId?: string
): Promise<ActionResult> {
  const parsed = departmentConfigSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Invalid input',
    }
  }

  try {
    const department = await prisma.outlet_department.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        outlet_id: true,
        outlet: { select: { restaurant_id: true } },
      },
    })

    if (!department) {
      return { success: false, error: 'Department not found' }
    }

    const name = parsed.data.name.trim()
    const email = parsed.data.email?.trim().toLowerCase() || null

    if (!email && !existingUserId) {
      return {
        success: false,
        error: 'Provide a contact email, or pick an existing user',
      }
    }

    // A DEPARTMENT user is created (if needed) and subscribed to the
    // department for every contact. Password is only used when creating.
    const hashedPassword = await hashPassword(derivePassword(email))

    const config = await prisma.$transaction(async (tx) => {
      const user = await ensureDepartmentUserAndSubscription(tx, {
        departmentId,
        outletId: department.outlet_id,
        restaurantId: department.outlet.restaurant_id,
        name,
        email,
        hashedPassword,
        existingUserId,
      })

      await assertNotAlreadyMapped(
        tx,
        departmentId,
        user.id,
        parsed.data.escalation_level_id ?? null
      )

      const created = await tx.department_config.create({
        data: {
          outlet_department_id: departmentId,
          name,
          email,
          type: parsed.data.type,
          whatsapp_number: parsed.data.whatsapp_number,
          is_active: parsed.data.is_active,
          user_id: user.id,
          escalation_level_id: parsed.data.escalation_level_id ?? null,
        },
      })

      return created
    })

    revalidatePath(`/outlets/${department.outlet_id}`)
    return { success: true, data: config }
  } catch (error) {
    if (error instanceof DuplicateMappingError) {
      return { success: false, error: error.message }
    }
    console.error('[departments] Error creating config:', error)
    return { success: false, error: 'Failed to create contact' }
  }
}

export async function updateDepartmentConfig(
  id: number,
  data: DepartmentConfigInput,
  existingUserId?: string
): Promise<ActionResult> {
  const parsed = departmentConfigSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Invalid input',
    }
  }

  try {
    const existing = await prisma.department_config.findUnique({
      where: { id },
      include: {
        outlet_department: {
          select: { id: true, outlet_id: true, outlet: { select: { restaurant_id: true } } },
        },
      },
    })

    if (!existing) {
      return { success: false, error: 'Contact not found' }
    }

    const departmentId = existing.outlet_department.id
    const name = parsed.data.name.trim()
    const newEmail = parsed.data.email?.trim().toLowerCase() || null
    const oldUserId = existing.user_id

    if (!newEmail && !existingUserId) {
      return {
        success: false,
        error: 'Provide a contact email, or pick an existing user',
      }
    }

    const hashedPassword = await hashPassword(derivePassword(newEmail))

    const config = await prisma.$transaction(async (tx) => {
      // Subscribe the (possibly new) contact's user to the department
      const user = await ensureDepartmentUserAndSubscription(tx, {
        departmentId,
        outletId: existing.outlet_department.outlet_id,
        restaurantId: existing.outlet_department.outlet.restaurant_id,
        name,
        email: newEmail,
        hashedPassword,
        existingUserId,
      })

      await assertNotAlreadyMapped(
        tx,
        departmentId,
        user.id,
        parsed.data.escalation_level_id ?? null,
        id
      )

      const updated = await tx.department_config.update({
        where: { id },
        data: {
          name,
          email: newEmail,
          type: parsed.data.type,
          whatsapp_number: parsed.data.whatsapp_number,
          is_active: parsed.data.is_active,
          user_id: user.id,
          escalation_level_id: parsed.data.escalation_level_id ?? null,
        },
      })

      // If the backing user changed, drop the old one's subscription when no
      // other contact in this department still references them.
      if (oldUserId !== user.id) {
        await cleanupSubscriptionIfUnused(tx, departmentId, oldUserId)
      }

      return updated
    })

    revalidatePath(`/outlets/${existing.outlet_department.outlet_id}`)
    return { success: true, data: config }
  } catch (error) {
    if (error instanceof DuplicateMappingError) {
      return { success: false, error: error.message }
    }
    console.error('[departments] Error updating config:', error)
    return { success: false, error: 'Failed to update contact' }
  }
}

export async function deleteDepartmentConfig(id: number): Promise<ActionResult> {
  try {
    const existing = await prisma.department_config.findUnique({
      where: { id },
      include: {
        outlet_department: { select: { id: true, outlet_id: true } },
      },
    })

    if (!existing) {
      return { success: false, error: 'Contact not found' }
    }

    const departmentId = existing.outlet_department.id
    const userId = existing.user_id

    await prisma.$transaction(async (tx) => {
      await tx.department_config.delete({ where: { id } })
      // Remove the user's subscription to this department if no other
      // contact still references them.
      await cleanupSubscriptionIfUnused(tx, departmentId, userId)
    })

    revalidatePath(`/outlets/${existing.outlet_department.outlet_id}`)
    return { success: true }
  } catch (error) {
    console.error('[departments] Error deleting config:', error)
    return { success: false, error: 'Failed to delete contact' }
  }
}

export async function toggleDepartmentConfigActive(
  id: number
): Promise<ActionResult> {
  try {
    const existing = await prisma.department_config.findUnique({
      where: { id },
      include: { outlet_department: { select: { outlet_id: true } } },
    })

    if (!existing) {
      return { success: false, error: 'Contact not found' }
    }

    const config = await prisma.department_config.update({
      where: { id },
      data: { is_active: !existing.is_active },
    })

    revalidatePath(`/outlets/${existing.outlet_department.outlet_id}`)
    return { success: true, data: config }
  } catch (error) {
    console.error('[departments] Error toggling config:', error)
    return { success: false, error: 'Failed to update contact' }
  }
}

// ── User ↔ department subscriptions ───────────────────────────────────────────

export async function subscribeUserToDepartment(
  userId: string,
  departmentId: number
): Promise<ActionResult> {
  try {
    const [user, department] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      }),
      prisma.outlet_department.findUnique({
        where: { id: departmentId },
        select: { id: true, outlet_id: true },
      }),
    ])

    if (!user) {
      return { success: false, error: 'User not found' }
    }
    if (!department) {
      return { success: false, error: 'Department not found' }
    }
    if (user.role !== UserRole.DEPARTMENT) {
      return {
        success: false,
        error: 'Only users with the DEPARTMENT role can be mapped to a department',
      }
    }

    await prisma.user_department_subscription.upsert({
      where: {
        user_id_outlet_department_id: {
          user_id: userId,
          outlet_department_id: departmentId,
        },
      },
      create: { user_id: userId, outlet_department_id: departmentId },
      update: {},
    })

    revalidatePath(`/outlets/${department.outlet_id}`)
    return { success: true }
  } catch (error) {
    console.error('[departments] Error subscribing user:', error)
    return { success: false, error: 'Failed to map user to department' }
  }
}

export async function unsubscribeUserFromDepartment(
  userId: string,
  departmentId: number
): Promise<ActionResult> {
  try {
    const department = await prisma.outlet_department.findUnique({
      where: { id: departmentId },
      select: { id: true, outlet_id: true },
    })

    if (!department) {
      return { success: false, error: 'Department not found' }
    }

    await prisma.user_department_subscription.deleteMany({
      where: { user_id: userId, outlet_department_id: departmentId },
    })

    revalidatePath(`/outlets/${department.outlet_id}`)
    return { success: true }
  } catch (error) {
    console.error('[departments] Error unsubscribing user:', error)
    return { success: false, error: 'Failed to remove user from department' }
  }
}

// ── Bulk map a single user to every department of an outlet ───────────────────

export interface BulkMapResult {
  mapped: number
  skipped: number
  total: number
}

/**
 * Maps one existing user to every department of an outlet in one go —
 * same logic as scripts/map-user-to-all-departments.mjs, exposed as a UI
 * action instead of a one-off script.
 */
export async function bulkMapUserToAllDepartments(
  outletId: number,
  userId: string,
  contactType: 'TO' | 'CC' = 'TO',
  contactEmail?: string,
  escalationLevelId?: number | null
): Promise<ActionResult<BulkMapResult>> {
  const mappableRoles: UserRole[] = [
    UserRole.DEPARTMENT,
    UserRole.GRE_HEAD,
    UserRole.SERVICE_EXCELLENCE,
    UserRole.STAFF,
  ]

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    const rawEmail = user.email || contactEmail || null
    if (rawEmail && !z.string().email().safeParse(rawEmail).success) {
      return { success: false, error: 'Provide a valid contact email' }
    }
    if (!mappableRoles.includes(user.role)) {
      return {
        success: false,
        error:
          'Only DEPARTMENT, GRE_HEAD, SERVICE_EXCELLENCE, or STAFF users can be mapped to departments',
      }
    }

    const levelId = escalationLevelId ?? null

    const departments = await prisma.outlet_department.findMany({
      where: { outlet_id: outletId },
      orderBy: { name: 'asc' },
      include: { configs: { select: { user_id: true, escalation_level_id: true } } },
    })

    const name = (user.name || rawEmail || 'Unnamed User').trim()
    const email = rawEmail ? rawEmail.trim().toLowerCase() : null

    let mapped = 0
    let skipped = 0

    for (const dept of departments) {
      // Excluded only if this exact (user, level) pair is already mapped here —
      // the same user can hold separate rows for separate escalation levels.
      const alreadyMapped = dept.configs.some(
        (c) => c.user_id === user.id && c.escalation_level_id === levelId
      )
      if (alreadyMapped) {
        skipped++
        continue
      }

      await prisma.$transaction(async (tx) => {
        await tx.department_config.create({
          data: {
            outlet_department_id: dept.id,
            name,
            email,
            type: contactType,
            whatsapp_number: [],
            is_active: true,
            user_id: user.id,
            escalation_level_id: levelId,
          },
        })

        await tx.user_department_subscription.upsert({
          where: {
            user_id_outlet_department_id: {
              user_id: user.id,
              outlet_department_id: dept.id,
            },
          },
          create: { user_id: user.id, outlet_department_id: dept.id },
          update: {},
        })
      })

      mapped++
    }

    revalidatePath(`/outlets/${outletId}`)
    return {
      success: true,
      data: { mapped, skipped, total: departments.length },
    }
  } catch (error) {
    console.error('[departments] Error bulk-mapping user to departments:', error)
    return { success: false, error: 'Failed to map user to departments' }
  }
}

// ── Outlet-level notification settings ────────────────────────────────────────

export async function updateOutletNotificationSettings(
  outletId: number,
  data: OutletNotificationSettingsInput
): Promise<ActionResult> {
  const parsed = outletNotificationSettingsSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Invalid input',
    }
  }

  try {
    const outlet = await prisma.outlet.update({
      where: { id: outletId },
      data: {
        default_email_cc: parsed.data.default_email_cc.map((e) =>
          e.trim().toLowerCase()
        ),
        dashboard_url: parsed.data.dashboard_url?.trim() || null,
      },
    })

    revalidatePath(`/outlets/${outletId}`)
    return { success: true, data: outlet }
  } catch (error) {
    console.error('[departments] Error updating notification settings:', error)
    return { success: false, error: 'Failed to update settings' }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type TxClient = Prisma.TransactionClient

interface EnsureUserArgs {
  departmentId: number
  outletId: number
  restaurantId: number
  name: string
  email: string | null
  hashedPassword: string
  existingUserId?: string
}

/**
 * Ensures a user is subscribed to the department and returns it. When
 * `existingUserId` is given (an existing user was picked in the mapping UI),
 * that exact user is reused as-is, even if they have no email of their own —
 * `email` only becomes this department_config row's routing address.
 * Otherwise falls back to the legacy behavior of finding or creating a
 * DEPARTMENT-role user by email — only possible when `email` is set, since a
 * bare `findUnique({ where: { email: null } })` would match an arbitrary
 * other no-email user rather than identify a specific one.
 */
async function ensureDepartmentUserAndSubscription(
  tx: TxClient,
  { departmentId, outletId, restaurantId, name, email, hashedPassword, existingUserId }: EnsureUserArgs
) {
  if (existingUserId) {
    const picked = await tx.users.findUnique({
      where: { id: existingUserId },
      select: { id: true },
    })
    if (picked) {
      await tx.user_department_subscription.upsert({
        where: {
          user_id_outlet_department_id: {
            user_id: picked.id,
            outlet_department_id: departmentId,
          },
        },
        create: { user_id: picked.id, outlet_department_id: departmentId },
        update: {},
      })
      return picked
    }
  }

  let user = email
    ? await tx.users.findUnique({ where: { email }, select: { id: true } })
    : null

  if (!user) {
    user = await tx.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.DEPARTMENT,
        outlet_id: outletId,
        restaurant_id: restaurantId,
      },
      select: { id: true },
    })
  }

  await tx.user_department_subscription.upsert({
    where: {
      user_id_outlet_department_id: {
        user_id: user.id,
        outlet_department_id: departmentId,
      },
    },
    create: {
      user_id: user.id,
      outlet_department_id: departmentId,
    },
    update: {},
  })

  return user
}

/**
 * Removes a user's subscription to a department when no remaining contact in
 * that department still references them. The user account itself is preserved.
 */
async function cleanupSubscriptionIfUnused(
  tx: TxClient,
  departmentId: number,
  userId: string | null
) {
  if (!userId) return

  const stillReferenced = await tx.department_config.count({
    where: { outlet_department_id: departmentId, user_id: userId },
  })

  if (stillReferenced > 0) return

  await tx.user_department_subscription.deleteMany({
    where: { user_id: userId, outlet_department_id: departmentId },
  })
}

/**
 * Derives a default password for a contact's backing user: from the email,
 * matching the seeding convention (segment before the first "." of the local
 * part, lowercased, + "#1234"), or a random one when there's no email to key
 * off of.
 */
function derivePassword(email: string | null): string {
  if (!email) return randomUUID()
  const localPart = email.split('@')[0] || ''
  const prefix = localPart.split('.')[0] || localPart
  return `${prefix.toLowerCase()}#1234`
}

class DuplicateMappingError extends Error {}

/**
 * A user may have several contacts in one department, but only one per
 * escalation level (`null` = legacy / role-based). Throws inside the calling
 * transaction so the subscription upsert is rolled back too.
 */
async function assertNotAlreadyMapped(
  tx: TxClient,
  departmentId: number,
  userId: string,
  escalationLevelId: number | null,
  ignoreConfigId?: number
) {
  const duplicates = await tx.department_config.count({
    where: {
      outlet_department_id: departmentId,
      user_id: userId,
      escalation_level_id: escalationLevelId,
      ...(ignoreConfigId ? { id: { not: ignoreConfigId } } : {}),
    },
  })
  if (duplicates > 0) {
    throw new DuplicateMappingError(
      'This user is already mapped to this department at that level'
    )
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  )
}
