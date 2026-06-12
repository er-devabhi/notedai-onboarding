"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface BulkStaffRecord {
  rowNumber: number;
  name: string;
  department: string;
  opdName: string;
  groupName: string;
}

export interface BulkStaffResultRow {
  rowNumber: number;
  name: string;
  department: string;
  opdName: string;
  groupName: string;
  status: "success" | "failed";
  error?: string;
}

export interface BulkStaffUploadResponse {
  results: BulkStaffResultRow[];
  totalSuccess: number;
  totalFailed: number;
}

export async function bulkUploadStaffs(
  outletId: number,
  records: BulkStaffRecord[],
): Promise<BulkStaffUploadResponse> {
  const results: BulkStaffResultRow[] = [];

  // Pre-fetch existing groups and compute next order for any new groups
  const existingGroups = await prisma.table_group.findMany({
    where: { outlet_id: outletId },
    select: { id: true, name: true, order: true },
  });
  const groupNameToId = new Map(existingGroups.map((g) => [g.name, g.id]));
  let nextGroupOrder =
    existingGroups.reduce((max, g) => Math.max(max, g.order), -1) + 1;

  const createData: {
    name: string;
    department: string | null;
    opd_name: string | null;
    outlet_id: number;
    group_id: number | null;
  }[] = [];
  const createMeta: BulkStaffResultRow[] = [];

  for (const record of records) {
    const base = {
      rowNumber: record.rowNumber,
      name: record.name,
      department: record.department,
      opdName: record.opdName,
      groupName: record.groupName,
    };

    const name = record.name.trim();
    const groupName = record.groupName.trim();

    if (!name) {
      results.push({ ...base, status: "failed", error: "Name is required" });
      continue;
    }

    let groupId: number | null = null;
    if (groupName) {
      groupId = groupNameToId.get(groupName) ?? null;

      if (!groupId) {
        try {
          const group = await prisma.table_group.upsert({
            where: { outlet_id_name: { outlet_id: outletId, name: groupName } },
            update: {},
            create: {
              name: groupName,
              outlet_id: outletId,
              order: nextGroupOrder++,
            },
          });
          groupId = group.id;
          groupNameToId.set(groupName, groupId);
        } catch (err) {
          console.error("[bulk-upload-staffs] Failed to create group", groupName, err);
          results.push({
            ...base,
            status: "failed",
            error: `Could not create group "${groupName}"`,
          });
          continue;
        }
      }
    }

    createData.push({
      name,
      department: record.department.trim() || null,
      opd_name: record.opdName.trim() || null,
      outlet_id: outletId,
      group_id: groupId,
    });
    createMeta.push({ ...base, status: "success" });
  }

  if (createData.length > 0) {
    await prisma.staffs.createMany({ data: createData });
  }

  results.push(...createMeta);
  results.sort((a, b) => a.rowNumber - b.rowNumber);

  revalidatePath(`/outlets/${outletId}`);

  return {
    results,
    totalSuccess: results.filter((r) => r.status === "success").length,
    totalFailed: results.filter((r) => r.status === "failed").length,
  };
}
