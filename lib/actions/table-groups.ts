"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { tableGroupSchema, type TableGroupInput } from "@/lib/validations";
import type { ActionResult } from "./organizations";

export async function getTableGroups(outletId: number) {
  const groups = await prisma.table_group.findMany({
    where: { outlet_id: outletId },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { tables: true } },
    },
  });
  return groups;
}

export async function createTableGroup(
  data: TableGroupInput,
): Promise<ActionResult> {
  const parsed = tableGroupSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    const group = await prisma.table_group.create({
      data: {
        name: parsed.data.name,
        outlet_id: parsed.data.outlet_id,
        order: parsed.data.order,
      },
    });

    revalidatePath(`/outlets/${parsed.data.outlet_id}`);

    return { success: true, data: group };
  } catch (error: unknown) {
    console.error("[v0] Error creating table group:", error);

    // Handle unique constraint violation
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "A table group with this name already exists in this outlet",
      };
    }

    return { success: false, error: "Failed to create table group" };
  }
}

export async function updateTableGroup(
  id: number,
  data: Partial<TableGroupInput>,
): Promise<ActionResult> {
  try {
    const group = await prisma.table_group.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });

    revalidatePath(`/outlets/${group.outlet_id}`);

    return { success: true, data: group };
  } catch (error: unknown) {
    console.error("[v0] Error updating table group:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "A table group with this name already exists in this outlet",
      };
    }

    return { success: false, error: "Failed to update table group" };
  }
}

export async function deleteTableGroup(id: number): Promise<ActionResult> {
  try {
    // Check if group has tables
    const group = await prisma.table_group.findUnique({
      where: { id },
      include: {
        _count: { select: { tables: true } },
      },
    });

    if (!group) {
      return { success: false, error: "Table group not found" };
    }

    if (group._count.tables > 0) {
      return {
        success: false,
        error: `Cannot delete group with ${group._count.tables} assigned tables. Remove or reassign tables first.`,
      };
    }

    await prisma.table_group.delete({ where: { id } });

    revalidatePath(`/outlets/${group.outlet_id}`);

    return { success: true };
  } catch (error) {
    console.error("[v0] Error deleting table group:", error);
    return { success: false, error: "Failed to delete table group" };
  }
}
