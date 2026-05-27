"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  createUserSchema,
  updateUserSchema,
  passwordResetSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations";
import type { ActionResult } from "./organizations";

export async function getUsers(outletId?: number) {
  const users = await prisma.users.findMany({
    where: outletId ? { outlet_id: outletId } : undefined,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      outlet_id: true,
      restaurant_id: true,
      created_at: true,
      outlet: {
        select: { id: true, name: true },
      },
      restaurants: {
        select: { id: true, restaurant_name: true },
      },
    },
  });
  return users;
}

export async function getUser(id: string) {
  const user = await prisma.users.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      outlet_id: true,
      restaurant_id: true,
      created_at: true,
      outlet: {
        select: { id: true, name: true },
      },
      restaurants: {
        select: { id: true, restaurant_name: true },
      },
    },
  });
  return user;
}

export async function createUser(data: CreateUserInput): Promise<ActionResult> {
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    // Hash password using bcrypt (compatible with existing backend)
    const hashedPassword = await hashPassword(parsed.data.password);

    const user = await prisma.users.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        role: parsed.data.role,
        restaurant_id: parsed.data.restaurant_id,
        outlet_id: parsed.data.outlet_id,
      },
    });

    if (parsed.data.outlet_id) {
      revalidatePath(`/outlets/${parsed.data.outlet_id}`);
    }
    revalidatePath("/users");

    // Return user without password
    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: unknown) {
    console.error("[v0] Error creating user:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "This email is already registered",
      };
    }

    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(
  id: string,
  data: UpdateUserInput,
): Promise<ActionResult> {
  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    const user = await prisma.users.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        restaurant_id: parsed.data.restaurant_id,
        outlet_id: parsed.data.outlet_id,
      },
    });

    if (user.outlet_id) {
      revalidatePath(`/outlets/${user.outlet_id}`);
    }
    revalidatePath(`/users/${id}`);

    return { success: true, data: user };
  } catch (error: unknown) {
    console.error("[v0] Error updating user:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "This email is already registered",
      };
    }

    return { success: false, error: "Failed to update user" };
  }
}

export async function resetUserPassword(
  userId: string,
  password: string,
  confirmPassword: string,
): Promise<ActionResult> {
  const parsed = passwordResetSchema.safeParse({ password, confirmPassword });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    const hashedPassword = await hashPassword(parsed.data.password);

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Do NOT log the password
    return { success: true };
  } catch (error) {
    console.error("[v0] Error resetting password for user:", userId);
    return { success: false, error: "Failed to reset password" };
  }
}

export async function unassignUserFromOutlet(
  userId: string,
): Promise<ActionResult> {
  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const outletId = user.outlet_id;

    await prisma.users.update({
      where: { id: userId },
      data: { outlet_id: null },
    });

    if (outletId) {
      revalidatePath(`/outlets/${outletId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[v0] Error unassigning user:", error);
    return { success: false, error: "Failed to unassign user" };
  }
}

export async function getUsersCount() {
  return prisma.users.count();
}
