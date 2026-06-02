"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { outletSchema, type OutletInput } from "@/lib/validations";
import type { ActionResult } from "./organizations";

export async function getOutlets(restaurantId?: number, search?: string) {
  const outlets = await prisma.outlet.findMany({
    where: {
      ...(restaurantId ? { restaurant_id: restaurantId } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" } }
        : {}),
    },
    orderBy: { created_at: "desc" },
    include: {
      restaurant: {
        select: { restaurant_name: true },
      },
      _count: {
        select: { tables: true, users: true, table_group: true },
      },
    },
  });
  return outlets;
}

export async function getOutlet(id: number) {
  const outlet = await prisma.outlet.findUnique({
    where: { id },
    include: {
      restaurant: {
        select: { id: true, restaurant_name: true, organizationType: true },
      },
      tables: {
        orderBy: [{ group_id: "asc" }, { order: "asc" }],
        include: {
          group: { select: { id: true, name: true } },
        },
      },
      users: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          created_at: true,
        },
      },
      table_group: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { tables: true } },
        },
      },
      outlet_departments: {
        orderBy: { name: "asc" },
        include: {
          configs: {
            orderBy: [{ type: "asc" }, { name: "asc" }],
          },
          user_subscriptions: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      },
    },
  });
  return outlet;
}

export async function createOutlet(data: OutletInput): Promise<ActionResult> {
  const parsed = outletSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    const outlet = await prisma.outlet.create({
      data: {
        name: parsed.data.name,
        location: parsed.data.location,
        region: parsed.data.region,
        branchCode: parsed.data.branchCode,
        restaurant_id: parsed.data.restaurant_id,
        managerNames: parsed.data.managerNames,
        serverNames: parsed.data.serverNames,
        departments: parsed.data.departments,
      },
    });

    revalidatePath("/outlets");
    revalidatePath("/setup");
    revalidatePath(`/restaurants/${parsed.data.restaurant_id}`);

    return { success: true, data: outlet };
  } catch (error) {
    console.error("[v0] Error creating outlet:", error);
    return { success: false, error: "Failed to create outlet" };
  }
}

export async function updateOutlet(
  id: number,
  data: Partial<OutletInput>,
): Promise<ActionResult> {
  try {
    const outlet = await prisma.outlet.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.region !== undefined && { region: data.region }),
        ...(data.branchCode !== undefined && { branchCode: data.branchCode }),
        ...(data.managerNames && { managerNames: data.managerNames }),
        ...(data.serverNames && { serverNames: data.serverNames }),
        ...(data.departments && { departments: data.departments }),
      },
    });

    revalidatePath("/outlets");
    revalidatePath(`/outlets/${id}`);

    return { success: true, data: outlet };
  } catch (error) {
    console.error("[v0] Error updating outlet:", error);
    return { success: false, error: "Failed to update outlet" };
  }
}

export async function getOutletsCount() {
  return prisma.outlet.count();
}

export async function getOutletSetupStatus(id: number) {
  const outlet = await prisma.outlet.findUnique({
    where: { id },
    include: {
      restaurant: { select: { id: true } },
      _count: {
        select: {
          table_group: true,
          tables: true,
          users: true,
        },
      },
    },
  });

  if (!outlet) return null;

  return {
    restaurantLinked: !!outlet.restaurant_id,
    basicInfoComplete: !!outlet.name && !!outlet.location,
    tableGroupCount: outlet._count.table_group,
    tableCount: outlet._count.tables,
    userCount: outlet._count.users,
  };
}
