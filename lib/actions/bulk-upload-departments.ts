'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface BulkDepartmentRecord {
  rowNumber: number
  name: string
}

export interface BulkDepartmentResultRow {
  rowNumber: number
  name: string
  status: 'success' | 'failed'
  error?: string
}

export interface BulkDepartmentUploadResponse {
  results: BulkDepartmentResultRow[]
  totalSuccess: number
  totalFailed: number
}

export async function bulkUploadDepartments(
  outletId: number,
  records: BulkDepartmentRecord[]
): Promise<BulkDepartmentUploadResponse> {
  const results: BulkDepartmentResultRow[] = []
  const seen = new Set<string>()

  // Pre-fetch existing department names so duplicates are reported as failed.
  const existing = await prisma.outlet_department.findMany({
    where: { outlet_id: outletId },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((d) => d.name))

  for (const record of records) {
    const name = record.name.trim()
    const base = { rowNumber: record.rowNumber, name: record.name }

    if (!name) {
      results.push({
        ...base,
        status: 'failed',
        error: 'Department name is required',
      })
      continue
    }
    // Duplicate within the file
    if (seen.has(name)) {
      results.push({
        ...base,
        status: 'failed',
        error: 'Duplicate department in file',
      })
      continue
    }
    // Already exists in this outlet
    if (existingNames.has(name)) {
      results.push({
        ...base,
        status: 'failed',
        error: 'Department already exists in this outlet',
      })
      continue
    }

    seen.add(name)

    try {
      await prisma.outlet_department.create({
        data: { outlet_id: outletId, name },
      })
      results.push({ ...base, status: 'success' })
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
          error: 'Department already exists in this outlet',
        })
      } else {
        console.error('[bulk-upload-departments] Failed to create:', err)
        results.push({
          ...base,
          status: 'failed',
          error: 'Failed to create department',
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
