'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface BulkUploadRecord {
  rowNumber: number
  tableGroup: string
  tableName: string
}

export interface BulkUploadResultRow {
  rowNumber: number
  tableGroup: string
  tableName: string
  status: 'success' | 'failed'
  error?: string
}

export interface BulkUploadResponse {
  results: BulkUploadResultRow[]
  totalSuccess: number
  totalFailed: number
}

export async function bulkUploadTables(
  outletId: number,
  records: BulkUploadRecord[]
): Promise<BulkUploadResponse> {
  const results: BulkUploadResultRow[] = []

  // Group records by table group name (preserve first-seen order)
  const recordsByGroup = new Map<string, BulkUploadRecord[]>()
  for (const record of records) {
    if (!recordsByGroup.has(record.tableGroup)) {
      recordsByGroup.set(record.tableGroup, [])
    }
    recordsByGroup.get(record.tableGroup)!.push(record)
  }

  // Pre-fetch existing groups to compute next order
  const existingGroups = await prisma.table_group.findMany({
    where: { outlet_id: outletId },
    select: { id: true, name: true, order: true },
  })
  const groupNameToId = new Map(existingGroups.map((g) => [g.name, g.id]))
  let nextGroupOrder =
    existingGroups.reduce((max, g) => Math.max(max, g.order), -1) + 1

  for (const [groupName, groupRecords] of recordsByGroup.entries()) {
    let groupId = groupNameToId.get(groupName)

    if (!groupId) {
      try {
        const group = await prisma.table_group.upsert({
          where: {
            outlet_id_name: { outlet_id: outletId, name: groupName },
          },
          update: {},
          create: {
            name: groupName,
            outlet_id: outletId,
            order: nextGroupOrder++,
          },
        })
        groupId = group.id
        groupNameToId.set(groupName, groupId)
      } catch (err) {
        console.error('[bulk-upload] Failed to create group', groupName, err)
        for (const r of groupRecords) {
          results.push({
            rowNumber: r.rowNumber,
            tableGroup: r.tableGroup,
            tableName: r.tableName,
            status: 'failed',
            error: `Could not create table group "${groupName}"`,
          })
        }
        continue
      }
    }

    // Compute next order within this group
    const tablesInGroup = await prisma.table.findMany({
      where: { outlet_id: outletId, group_id: groupId },
      select: { order: true },
    })
    let nextTableOrder =
      tablesInGroup.reduce((max, t) => Math.max(max, t.order), -1) + 1

    for (const record of groupRecords) {
      try {
        await prisma.table.create({
          data: {
            table_no: record.tableName,
            outlet_id: outletId,
            group_id: groupId,
            order: nextTableOrder++,
          },
        })
        results.push({
          rowNumber: record.rowNumber,
          tableGroup: record.tableGroup,
          tableName: record.tableName,
          status: 'success',
        })
      } catch (err: unknown) {
        let errorMsg = 'Failed to create table'
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        ) {
          errorMsg = `Table "${record.tableName}" already exists in this outlet`
        }
        results.push({
          rowNumber: record.rowNumber,
          tableGroup: record.tableGroup,
          tableName: record.tableName,
          status: 'failed',
          error: errorMsg,
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
