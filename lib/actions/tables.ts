"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { tableSchema, type TableInput } from "@/lib/validations";
import type { ActionResult } from "./organizations";

export async function getTables(outletId: number) {
  const tables = await prisma.table.findMany({
    where: { outlet_id: outletId },
    orderBy: [{ group_id: "asc" }, { order: "asc" }],
    include: {
      group: { select: { id: true, name: true } },
    },
  });
  return tables;
}

export async function createTable(data: TableInput): Promise<ActionResult> {
  const parsed = tableSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input",
    };
  }

  // Validate group belongs to same outlet
  if (parsed.data.group_id) {
    const group = await prisma.table_group.findUnique({
      where: { id: parsed.data.group_id },
    });

    if (!group) {
      return { success: false, error: "Table group not found" };
    }

    if (group.outlet_id !== parsed.data.outlet_id) {
      return {
        success: false,
        error: "Cannot assign table to a group from a different outlet",
      };
    }
  }

  try {
    const table = await prisma.table.create({
      data: {
        table_no: parsed.data.table_no,
        outlet_id: parsed.data.outlet_id,
        group_id: parsed.data.group_id,
        capacity: parsed.data.capacity,
        active: parsed.data.active,
        order: parsed.data.order,
      },
    });

    revalidatePath(`/outlets/${parsed.data.outlet_id}`);

    return { success: true, data: table };
  } catch (error: unknown) {
    console.error("[v0] Error creating table:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: `Table "${parsed.data.table_no}" already exists in this outlet`,
      };
    }

    return { success: false, error: "Failed to create table" };
  }
}

export async function updateTable(
  id: number,
  data: Partial<TableInput>,
): Promise<ActionResult> {
  try {
    // Get current table
    const currentTable = await prisma.table.findUnique({ where: { id } });
    if (!currentTable) {
      return { success: false, error: "Table not found" };
    }

    // Validate group if changing
    if (data.group_id !== undefined && data.group_id !== null) {
      const group = await prisma.table_group.findUnique({
        where: { id: data.group_id },
      });

      if (!group) {
        return { success: false, error: "Table group not found" };
      }

      if (group.outlet_id !== currentTable.outlet_id) {
        return {
          success: false,
          error: "Cannot assign table to a group from a different outlet",
        };
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data: {
        ...(data.table_no && { table_no: data.table_no }),
        ...(data.group_id !== undefined && { group_id: data.group_id }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });

    revalidatePath(`/outlets/${currentTable.outlet_id}`);

    return { success: true, data: table };
  } catch (error: unknown) {
    console.error("[v0] Error updating table:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Table number already exists in this outlet",
      };
    }

    return { success: false, error: "Failed to update table" };
  }
}

export async function toggleTableActive(id: number): Promise<ActionResult> {
  try {
    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) {
      return { success: false, error: "Table not found" };
    }

    const updated = await prisma.table.update({
      where: { id },
      data: { active: !table.active },
    });

    revalidatePath(`/outlets/${table.outlet_id}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("[v0] Error toggling table:", error);
    return { success: false, error: "Failed to update table" };
  }
}

export async function getTablesCount() {
  return prisma.table.count();
}
