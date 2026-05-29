import type { UserRole } from '@prisma/client'

export interface Restaurant {
  id: number
  restaurant_name: string | null
  organizationType: 'RESTAURANT' | 'HOSPITAL'
}

export interface TableGroup {
  id: number
  name: string
  outlet_id: number
  order: number
  created_at: Date
  updated_at: Date
  _count?: {
    tables: number
  }
}

export interface Table {
  id: number
  table_no: string
  outlet_id: number
  group_id: number | null
  capacity: number | null
  active: boolean
  order: number
  created_at: Date
  updated_at: Date
  group?: {
    id: number
    name: string
  } | null
}

export interface User {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  outlet_id?: number | null
  restaurant_id?: number | null
  created_at: Date
}

export interface DepartmentConfig {
  id: number
  outlet_department_id: number
  name: string
  email: string
  whatsapp_number: string[]
  type: 'TO' | 'CC'
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface DepartmentSubscription {
  id: number
  user_id: string
  outlet_department_id: number
  user: {
    id: string
    name: string | null
    email: string | null
    role: UserRole
  }
}

export interface OutletDepartment {
  id: number
  outlet_id: number
  name: string
  created_at: Date
  updated_at: Date
  configs: DepartmentConfig[]
  user_subscriptions: DepartmentSubscription[]
}

export interface OutletWithRelations {
  id: number
  name: string
  location: string | null
  region: string | null
  branchCode: string | null
  managerNames: string[]
  serverNames: string[]
  departments: string[]
  default_email_cc: string[]
  dashboard_url: string | null
  restaurant_id: number
  created_at: Date
  updated_at: Date
  restaurant: Restaurant | null
  tables: Table[]
  users: User[]
  table_group: TableGroup[]
  outlet_departments: OutletDepartment[]
}

export interface SetupStatus {
  restaurantLinked: boolean
  basicInfoComplete: boolean
  tableGroupCount: number
  tableCount: number
  userCount: number
}
