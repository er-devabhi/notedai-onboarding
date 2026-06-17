'use server'

import { revalidatePath } from 'next/cache'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'

export interface BulkDeptMappingRecord {
  rowNumber: number
  department: string
  hodName: string
  mobile: string
  hodEmail: string
  ccEmails: string
}

export interface ContactResult {
  name: string
  email: string
  type: 'TO' | 'CC'
  status: 'success' | 'failed'
  error?: string
  isNewUser?: boolean
  password?: string
}

export interface BulkDeptMappingResultRow {
  rowNumber: number
  department: string
  departmentCreated: boolean
  status: 'success' | 'partial' | 'failed'
  error?: string
  contacts: ContactResult[]
}

export interface BulkDeptMappingResponse {
  results: BulkDeptMappingResultRow[]
  totalDepartments: number
  totalSuccess: number
  totalPartial: number
  totalFailed: number
  totalContactsCreated: number
  totalContactsFailed: number
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function derivePasswordFromEmail(email: string): string {
  const localPart = email.split('@')[0] || ''
  const prefix = localPart.split('.')[0] || localPart
  return `${prefix.toLowerCase()}#1234`
}

export async function bulkUploadDeptMapping(
  outletId: number,
  records: BulkDeptMappingRecord[]
): Promise<BulkDeptMappingResponse> {
  const results: BulkDeptMappingResultRow[] = []

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    select: { id: true, restaurant_id: true },
  })

  if (!outlet) {
    return {
      results: [
        {
          rowNumber: 0,
          department: '',
          departmentCreated: false,
          status: 'failed',
          error: 'Outlet not found',
          contacts: [],
        },
      ],
      totalDepartments: 0,
      totalSuccess: 0,
      totalPartial: 0,
      totalFailed: 1,
      totalContactsCreated: 0,
      totalContactsFailed: 0,
    }
  }

  for (const record of records) {
    const deptName = record.department.trim()
    const hodName = record.hodName.trim()
    const hodEmail = record.hodEmail.trim().toLowerCase()
    const mobile = record.mobile.trim()

    const rowResult: BulkDeptMappingResultRow = {
      rowNumber: record.rowNumber,
      department: deptName,
      departmentCreated: false,
      status: 'success',
      contacts: [],
    }

    // ── Validate department name ─────────────────────────────────────────
    if (!deptName) {
      rowResult.status = 'failed'
      rowResult.error = 'Department name is required'
      results.push(rowResult)
      continue
    }

    // ── Validate HOD email ──────────────────────────────────────────────
    if (!hodEmail) {
      rowResult.status = 'failed'
      rowResult.error = "HOD's Email Address is required"
      results.push(rowResult)
      continue
    }
    if (!emailRegex.test(hodEmail)) {
      rowResult.status = 'failed'
      rowResult.error = `Invalid HOD email format: "${hodEmail}"`
      results.push(rowResult)
      continue
    }

    // ── Validate HOD name ───────────────────────────────────────────────
    if (!hodName) {
      rowResult.status = 'failed'
      rowResult.error = "HOD's Name is required"
      results.push(rowResult)
      continue
    }

    // ── Validate mobile (optional, but must be valid if provided) ─────
    const whatsappNumbers: string[] = []
    if (mobile) {
      if (/^\d{7,15}$/.test(mobile)) {
        whatsappNumbers.push(mobile)
      } else {
        rowResult.status = 'failed'
        rowResult.error = `Invalid mobile number "${mobile}". Must be 7-15 digits.`
        results.push(rowResult)
        continue
      }
    }

    // ── Parse CC emails ─────────────────────────────────────────────────
    const ccList = record.ccEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    const invalidCcEmails = ccList.filter((e) => !emailRegex.test(e))
    if (invalidCcEmails.length > 0) {
      rowResult.status = 'failed'
      rowResult.error = `Invalid CC email(s): ${invalidCcEmails.join(', ')}`
      results.push(rowResult)
      continue
    }

    // ── Upsert department (create if not exists) ───────────────────────
    let outletDepartment: { id: number } | null = null
    try {
      const existing = await prisma.outlet_department.findUnique({
        where: { outlet_id_name: { outlet_id: outletId, name: deptName } },
        select: { id: true },
      })
      if (existing) {
        outletDepartment = existing
      } else {
        outletDepartment = await prisma.outlet_department.create({
          data: { outlet_id: outletId, name: deptName },
          select: { id: true },
        })
        rowResult.departmentCreated = true
      }
    } catch (err) {
      console.error('[bulk-dept-mapping] Failed to upsert department', deptName, err)
      rowResult.status = 'failed'
      rowResult.error = `Could not create department "${deptName}"`
      results.push(rowResult)
      continue
    }

    // ── Create TO contact (HOD) ────────────────────────────────────────
    const hodResult = await createContactWithUser(
      outletDepartment.id,
      outlet.id,
      outlet.restaurant_id,
      {
        name: hodName,
        email: hodEmail,
        type: 'TO' as const,
        whatsapp_number: whatsappNumbers,
      }
    )
    rowResult.contacts.push(hodResult)

    // ── Create CC contacts ──────────────────────────────────────────────
    for (const ccEmail of ccList) {
      if (ccEmail === hodEmail) continue

      const ccResult = await createContactWithUser(
        outletDepartment.id,
        outlet.id,
        outlet.restaurant_id,
        {
          name: ccEmail.split('@')[0] || ccEmail,
          email: ccEmail,
          type: 'CC' as const,
          whatsapp_number: [],
        }
      )
      rowResult.contacts.push(ccResult)
    }

    // ── Determine overall row status ───────────────────────────────────
    const successCount = rowResult.contacts.filter((c) => c.status === 'success').length
    const failCount = rowResult.contacts.filter((c) => c.status === 'failed').length

    if (failCount === 0) {
      rowResult.status = 'success'
    } else if (successCount === 0) {
      rowResult.status = 'failed'
    } else {
      rowResult.status = 'partial'
    }

    results.push(rowResult)
  }

  revalidatePath(`/outlets/${outletId}`)

  const allContacts = results.flatMap((r) => r.contacts)

  return {
    results,
    totalDepartments: results.length,
    totalSuccess: results.filter((r) => r.status === 'success').length,
    totalPartial: results.filter((r) => r.status === 'partial').length,
    totalFailed: results.filter((r) => r.status === 'failed').length,
    totalContactsCreated: allContacts.filter((c) => c.status === 'success').length,
    totalContactsFailed: allContacts.filter((c) => c.status === 'failed').length,
  }
}

async function createContactWithUser(
  departmentId: number,
  outletId: number,
  restaurantId: number,
  contact: {
    name: string
    email: string
    type: 'TO' | 'CC'
    whatsapp_number: string[]
  }
): Promise<ContactResult> {
  const derivedPassword = derivePasswordFromEmail(contact.email)

  try {
    const hashedPassword = await hashPassword(derivedPassword)
    let isNewUser = false

    await prisma.$transaction(async (tx) => {
      await tx.department_config.create({
        data: {
          outlet_department_id: departmentId,
          name: contact.name,
          email: contact.email,
          type: contact.type,
          whatsapp_number: contact.whatsapp_number,
          is_active: true,
        },
      })

      let user = await tx.users.findUnique({
        where: { email: contact.email },
        select: { id: true },
      })

      if (!user) {
        user = await tx.users.create({
          data: {
            name: contact.name,
            email: contact.email,
            password: hashedPassword,
            role: UserRole.DEPARTMENT,
            outlet_id: outletId,
            restaurant_id: restaurantId,
          },
          select: { id: true },
        })
        isNewUser = true
      }

      await tx.user_department_subscription.upsert({
        where: {
          user_id_outlet_department_id: {
            user_id: user.id,
            outlet_department_id: departmentId,
          },
        },
        create: {
          user_id: user.id,
          outlet_department_id: departmentId,
        },
        update: {},
      })
    })

    return {
      name: contact.name,
      email: contact.email,
      type: contact.type,
      status: 'success',
      isNewUser,
      password: isNewUser ? derivedPassword : undefined,
    }
  } catch (err: unknown) {
    let errorMsg = 'Failed to create contact'
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      errorMsg = `Contact "${contact.email}" already exists in this department`
    }
    console.error(`[bulk-dept-mapping] Failed for ${contact.email}:`, err)
    return {
      name: contact.name,
      email: contact.email,
      type: contact.type,
      status: 'failed',
      error: errorMsg,
    }
  }
}
