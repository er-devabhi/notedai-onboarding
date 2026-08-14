'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  escalationLevelSchema,
  type EscalationLevelInput,
} from '@/lib/validations'
import type { ActionResult } from './organizations'

// field_config is a raw JSON passthrough edited by hand (Supabase-style
// jsonb editor) — empty/null text means an actual SQL NULL, which Prisma
// requires the Prisma.DbNull sentinel for on nullable Json columns.
function parseFieldConfig(raw: string | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (raw === null || raw.trim() === '') return Prisma.DbNull
  return JSON.parse(raw)
}

export async function getEscalationLevels(outletId: number) {
  return prisma.escalation_level.findMany({
    where: { outlet_id: outletId },
    orderBy: { sequence: 'asc' },
  })
}

export async function createEscalationLevel(
  outletId: number,
  data: EscalationLevelInput
): Promise<ActionResult> {
  const parsed = escalationLevelSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Invalid input',
    }
  }

  try {
    const sequenceTaken = await prisma.escalation_level.findFirst({
      where: { outlet_id: outletId, sequence: parsed.data.sequence },
      select: { id: true },
    })
    if (sequenceTaken) {
      return {
        success: false,
        error: `An escalation level with sequence ${parsed.data.sequence} already exists for this outlet`,
      }
    }

    const level = await prisma.escalation_level.create({
      data: {
        outlet_id: outletId,
        key: parsed.data.key.trim(),
        name: parsed.data.name.trim(),
        role: parsed.data.role,
        sequence: parsed.data.sequence,
        is_active: parsed.data.is_active,
        field_config: parseFieldConfig(parsed.data.field_config),
        sla_config: parsed.data.sla_config,
        updated_at: new Date(),
      },
    })

    revalidatePath(`/outlets/${outletId}`)
    return { success: true, data: level }
  } catch (error: unknown) {
    console.error('[escalation-levels] Error creating escalation level:', error)

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return {
        success: false,
        error: `An escalation level with key "${parsed.data.key}" already exists for this outlet`,
      }
    }

    return { success: false, error: 'Failed to create escalation level' }
  }
}

export async function updateEscalationLevel(
  id: number,
  outletId: number,
  data: EscalationLevelInput
): Promise<ActionResult> {
  const parsed = escalationLevelSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Invalid input',
    }
  }

  try {
    const sequenceTaken = await prisma.escalation_level.findFirst({
      where: {
        outlet_id: outletId,
        sequence: parsed.data.sequence,
        id: { not: id },
      },
      select: { id: true },
    })
    if (sequenceTaken) {
      return {
        success: false,
        error: `An escalation level with sequence ${parsed.data.sequence} already exists for this outlet`,
      }
    }

    // Scope by outlet_id too, not just id, so a mismatched id/outletId pair
    // (bug or tampered client call) can't silently mutate another outlet's row.
    const result = await prisma.escalation_level.updateMany({
      where: { id, outlet_id: outletId },
      data: {
        key: parsed.data.key.trim(),
        name: parsed.data.name.trim(),
        role: parsed.data.role,
        sequence: parsed.data.sequence,
        is_active: parsed.data.is_active,
        field_config: parseFieldConfig(parsed.data.field_config),
        sla_config: parsed.data.sla_config,
        updated_at: new Date(),
      },
    })

    if (result.count === 0) {
      return {
        success: false,
        error: 'Escalation level not found for this outlet',
      }
    }

    revalidatePath(`/outlets/${outletId}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('[escalation-levels] Error updating escalation level:', error)

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return {
        success: false,
        error: `An escalation level with key "${parsed.data.key}" already exists for this outlet`,
      }
    }

    return { success: false, error: 'Failed to update escalation level' }
  }
}

export async function toggleEscalationLevelActive(
  id: number,
  outletId: number
): Promise<ActionResult> {
  try {
    const level = await prisma.escalation_level.findFirst({
      where: { id, outlet_id: outletId },
      select: { is_active: true },
    })

    if (!level) {
      return { success: false, error: 'Escalation level not found for this outlet' }
    }

    await prisma.escalation_level.update({
      where: { id },
      data: { is_active: !level.is_active, updated_at: new Date() },
    })

    revalidatePath(`/outlets/${outletId}`)
    return { success: true }
  } catch (error) {
    console.error('[escalation-levels] Error toggling escalation level:', error)
    return { success: false, error: 'Failed to update status' }
  }
}
