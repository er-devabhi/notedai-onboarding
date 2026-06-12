"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "./organizations";

export interface StaffInput {
  name: string;
  outlet_id: number;
  group_id: number | null;
  department: string | null;
  opd_name: string | null;
}

export async function createStaff(data: StaffInput): Promise<ActionResult> {
  if (!data.name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  if (data.group_id) {
    const group = await prisma.table_group.findUnique({
      where: { id: data.group_id },
    });

    if (!group) {
      return { success: false, error: "OPD group not found" };
    }

    if (group.outlet_id !== data.outlet_id) {
      return {
        success: false,
        error: "Cannot assign staff to a group from a different outlet",
      };
    }
  }

  try {
    const staff = await prisma.staffs.create({
      data: {
        name: data.name.trim(),
        outlet_id: data.outlet_id,
        group_id: data.group_id,
        department: data.department?.trim() || null,
        opd_name: data.opd_name?.trim() || null,
      },
    });

    revalidatePath(`/outlets/${data.outlet_id}`);

    return { success: true, data: staff };
  } catch (error) {
    console.error("[v0] Error creating staff:", error);
    return { success: false, error: "Failed to create staff" };
  }
}

export async function updateStaff(
  id: number,
  data: Partial<StaffInput>,
): Promise<ActionResult> {
  try {
    const currentStaff = await prisma.staffs.findUnique({ where: { id } });
    if (!currentStaff) {
      return { success: false, error: "Staff not found" };
    }

    if (data.group_id !== undefined && data.group_id !== null) {
      const group = await prisma.table_group.findUnique({
        where: { id: data.group_id },
      });

      if (!group) {
        return { success: false, error: "OPD group not found" };
      }

      if (group.outlet_id !== currentStaff.outlet_id) {
        return {
          success: false,
          error: "Cannot assign staff to a group from a different outlet",
        };
      }
    }

    const staff = await prisma.staffs.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.group_id !== undefined && { group_id: data.group_id }),
        ...(data.department !== undefined && {
          department: data.department?.trim() || null,
        }),
        ...(data.opd_name !== undefined && {
          opd_name: data.opd_name?.trim() || null,
        }),
      },
    });

    revalidatePath(`/outlets/${currentStaff.outlet_id}`);

    return { success: true, data: staff };
  } catch (error) {
    console.error("[v0] Error updating staff:", error);
    return { success: false, error: "Failed to update staff" };
  }
}

export async function deleteStaff(id: number): Promise<ActionResult> {
  try {
    const staff = await prisma.staffs.delete({ where: { id } });
    revalidatePath(`/outlets/${staff.outlet_id}`);
    return { success: true, data: staff };
  } catch (error) {
    console.error("[v0] Error deleting staff:", error);
    return { success: false, error: "Failed to delete staff" };
  }
}
