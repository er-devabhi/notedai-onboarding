import { UserRole } from '@prisma/client'
import { z } from 'zod'

// Restaurant validation
export const restaurantSchema = z.object({
  restaurant_name: z.string().min(1, 'Restaurant name is required').max(255),
  organizationType: z.enum(['RESTAURANT', 'HOSPITAL']).default('RESTAURANT'),
})

export type RestaurantInput = z.infer<typeof restaurantSchema>

// Outlet validation
export const outletSchema = z.object({
  name: z.string().min(1, 'Outlet name is required').max(255),
  location: z.string().max(255).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  branchCode: z.string().max(50).optional().nullable(),
  restaurant_id: z.number().int().positive('Restaurant is required'),
  managerNames: z.array(z.string()).default([]),
  serverNames: z.array(z.string()).default([]),
  departments: z.array(z.string()).default([]),
})

export type OutletInput = z.infer<typeof outletSchema>

// Table Group validation
export const tableGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  outlet_id: z.number().int().positive(),
  order: z.number().int().min(0).default(0),
})

export type TableGroupInput = z.infer<typeof tableGroupSchema>

// Table validation
export const tableSchema = z.object({
  table_no: z.string().min(1, 'Table number is required').max(50),
  outlet_id: z.number().int().positive(),
  group_id: z.number().int().positive().optional().nullable(),
  capacity: z.number().int().min(1).max(100).optional().nullable(),
  active: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
})

export type TableInput = z.infer<typeof tableSchema>

// Department (outlet_department) validation
export const outletDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(255),
})

export type OutletDepartmentInput = z.infer<typeof outletDepartmentSchema>

// Department contact config validation
export const departmentConfigSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(255),
  email: z.string().email('A valid email is required').max(255),
  type: z.enum(['TO', 'CC']),
  whatsapp_number: z
    .array(
      z
        .string()
        .regex(/^\d{7,15}$/, 'WhatsApp number must be 7-15 digits (no spaces or symbols)')
    )
    .default([]),
  is_active: z.boolean().default(true),
})

export type DepartmentConfigInput = z.infer<typeof departmentConfigSchema>

// Outlet notification settings (default CC + dashboard URL)
export const outletNotificationSettingsSchema = z.object({
  default_email_cc: z
    .array(z.string().email('Each CC entry must be a valid email'))
    .default([]),
  dashboard_url: z
    .string()
    .url('Must be a valid URL')
    .max(2048)
    .optional()
    .or(z.literal('')),
})

export type OutletNotificationSettingsInput = z.infer<
  typeof outletNotificationSettingsSchema
>

// User validation
export const userRoles = [
  'ADMIN',
  'MANAGER',
  'SALES_MANAGER',
  'KITCHEN_MANAGER',
  'STAFF',
  'DISCHARGE',
  'PWO',
  'GRE',
  'SUPERVISOR',
  'SENIOR_EXECUTIVE',
  'TRAINEE',
  'EXECUTIVE',
  'ASSISTANT',
  'DEPARTMENT'
] as const

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Valid email required').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(userRoles).default('MANAGER'),
  restaurant_id: z.number().int().positive().optional().nullable(),
  outlet_id: z.number().int().positive().optional().nullable(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = createUserSchema.omit({ password: true })

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const passwordResetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

export type PasswordResetInput = z.infer<typeof passwordResetSchema>

// Login validation
export const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
