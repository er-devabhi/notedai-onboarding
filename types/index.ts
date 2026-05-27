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

export interface OutletWithRelations {
  id: number
  name: string
  location: string | null
  region: string | null
  branchCode: string | null
  managerNames: string[]
  serverNames: string[]
  departments: string[]
  restaurant_id: number
  created_at: Date
  updated_at: Date
  restaurant: Restaurant | null
  tables: Table[]
  users: User[]
  table_group: TableGroup[]
}

export interface SetupStatus {
  restaurantLinked: boolean
  basicInfoComplete: boolean
  tableGroupCount: number
  tableCount: number
  userCount: number
}
