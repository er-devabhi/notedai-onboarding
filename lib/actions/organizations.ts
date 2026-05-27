'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  OrganizationInput,
  organizationSchema,
} from '@/components/organizations/organization-edit-form'

export type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export async function getOrganizations(type?: string) {
  const where =
    type === 'restaurant'
      ? { organizationType: 'RESTAURANT' as const }
      : type === 'hospital'
        ? { organizationType: 'HOSPITAL' as const }
        : undefined

  const organizations = await prisma.restaurants.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      _count: {
        select: { outlets: true, users: true },
      },
    },
  })
  return organizations
}

export async function getOrganization(id: number) {
  const organization = await prisma.restaurants.findUnique({
    where: { id },
    include: {
      outlets: {
        orderBy: { created_at: 'desc' },
      },
      _count: {
        select: { outlets: true, users: true },
      },
    },
  })
  return organization
}

export async function createOrganization(
  data: OrganizationInput
): Promise<ActionResult> {
  const parsed = organizationSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Invalid input',
    }
  }

  try {
    const organization = await prisma.restaurants.create({
      data: {
        restaurant_name: parsed.data.restaurant_name,
        organizationType: parsed.data.organizationType,
      },
    })

    revalidatePath('/organizations')
    revalidatePath('/setup')

    return { success: true, data: organization }
  } catch (error) {
    console.error('[v0] Error creating organization:', error)
    return { success: false, error: 'Failed to create organization' }
  }
}

export async function updateOrganization(
  id: number,
  data: OrganizationInput
): Promise<ActionResult> {
  const parsed = organizationSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Invalid input',
    }
  }

  try {
    const organization = await prisma.restaurants.update({
      where: { id },
      data: {
        restaurant_name: parsed.data.restaurant_name,
        organizationType: parsed.data.organizationType,
      },
    })

    revalidatePath('/organizations')
    revalidatePath(`/organizations/${id}`)
    revalidatePath('/setup')

    return { success: true, data: organization }
  } catch (error) {
    console.error('[v0] Error updating organization:', error)
    return { success: false, error: 'Failed to update organization' }
  }
}

export async function getOrganizationsCount() {
  return prisma.restaurants.count()
}
