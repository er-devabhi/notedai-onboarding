'use server'

import { revalidatePath } from 'next/cache'
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
  data: DepartmentConfigInput
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
    const email = parsed.data.email.trim().toLowerCase()

    // A DEPARTMENT user is created (if needed) and subscribed to the
    // department for every contact. Password is only used when creating.
    const hashedPassword = await hashPassword(derivePasswordFromEmail(email))

    const config = await prisma.$transaction(async (tx) => {
      const created = await tx.department_config.create({
        data: {
          outlet_department_id: departmentId,
          name,
          email,
          type: parsed.data.type,
          whatsapp_number: parsed.data.whatsapp_number,
          is_active: parsed.data.is_active,
        },
      })

      await ensureDepartmentUserAndSubscription(tx, {
        departmentId,
        outletId: department.outlet_id,
        restaurantId: department.outlet.restaurant_id,
        name,
        email,
        hashedPassword,
      })

      return created
    })

    revalidatePath(`/outlets/${department.outlet_id}`)
    return { success: true, data: config }
  } catch (error) {
    console.error('[departments] Error creating config:', error)
    return { success: false, error: 'Failed to create contact' }
  }
}

export async function updateDepartmentConfig(
  id: number,
  data: DepartmentConfigInput
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
    const newEmail = parsed.data.email.trim().toLowerCase()
    const oldEmail = existing.email
    const hashedPassword = await hashPassword(derivePasswordFromEmail(newEmail))

    const config = await prisma.$transaction(async (tx) => {
      const updated = await tx.department_config.update({
        where: { id },
        data: {
          name,
          email: newEmail,
          type: parsed.data.type,
          whatsapp_number: parsed.data.whatsapp_number,
          is_active: parsed.data.is_active,
        },
      })

      // Subscribe the (possibly new) contact's user to the department
      await ensureDepartmentUserAndSubscription(tx, {
        departmentId,
        outletId: existing.outlet_department.outlet_id,
        restaurantId: existing.outlet_department.outlet.restaurant_id,
        name,
        email: newEmail,
        hashedPassword,
      })

      // If the email changed, drop the old subscription when no other
      // contact in this department still references it.
      if (oldEmail !== newEmail) {
        await cleanupSubscriptionIfUnused(tx, departmentId, oldEmail)
      }

      return updated
    })

    revalidatePath(`/outlets/${existing.outlet_department.outlet_id}`)
    return { success: true, data: config }
  } catch (error) {
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
    const email = existing.email

    await prisma.$transaction(async (tx) => {
      await tx.department_config.delete({ where: { id } })
      // Remove the user's subscription to this department if no other
      // contact still references the same email.
      await cleanupSubscriptionIfUnused(tx, departmentId, email)
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
  email: string
  hashedPassword: string
}

/**
 * Ensures a DEPARTMENT-role user exists for the given email and is subscribed
 * to the department. Existing users are reused (matched by email); only the
 * subscription is added for them.
 */
async function ensureDepartmentUserAndSubscription(
  tx: TxClient,
  { departmentId, outletId, restaurantId, name, email, hashedPassword }: EnsureUserArgs
) {
  let user = await tx.users.findUnique({
    where: { email },
    select: { id: true },
  })

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
 * that department references the email. The user account itself is preserved.
 */
async function cleanupSubscriptionIfUnused(
  tx: TxClient,
  departmentId: number,
  email: string
) {
  const stillReferenced = await tx.department_config.count({
    where: { outlet_department_id: departmentId, email },
  })

  if (stillReferenced > 0) return

  const user = await tx.users.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) return

  await tx.user_department_subscription.deleteMany({
    where: { user_id: user.id, outlet_department_id: departmentId },
  })
}

/**
 * Derives a default password from an email, matching the seeding convention:
 * the segment before the first "." of the local part, lowercased, + "#1234".
 */
function derivePasswordFromEmail(email: string): string {
  const localPart = email.split('@')[0] || ''
  const prefix = localPart.split('.')[0] || localPart
  return `${prefix.toLowerCase()}#1234`
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  )
}
