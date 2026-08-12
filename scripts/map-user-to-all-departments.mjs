// One-off admin script: maps a single existing user to every department of an
// outlet (creates the department_config contact row + user_department_subscription
// for each department that doesn't already have this user's email mapped).
//
// Fill in the two consts below, then run:
//   node --env-file=.env scripts/map-user-to-all-departments.mjs

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const USER_ID = '90ba5268-7454-4e57-a65a-93d74ab15148'
const OUTLET_ID = 16  // e.g. 16

// Contact type used for the created department_config row ('TO' or 'CC')
const CONTACT_TYPE = 'TO'

async function main() {
  if (!USER_ID) throw new Error('Set USER_ID at the top of the script')
  if (!OUTLET_ID) throw new Error('Set OUTLET_ID at the top of the script')

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set (run with: node --env-file=.env ...)')

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

  try {
    const user = await prisma.users.findUnique({
      where: { id: USER_ID },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!user) throw new Error(`No user found with id ${USER_ID}`)
    if (!user.email) throw new Error(`User ${USER_ID} has no email set`)

    const outlet = await prisma.outlet.findUnique({
      where: { id: OUTLET_ID },
      select: { id: true, name: true },
    })
    if (!outlet) throw new Error(`No outlet found with id ${OUTLET_ID}`)

    console.log(`User:   ${user.name || '(unnamed)'} <${user.email}> [${user.role}]`)
    console.log(`Outlet: ${outlet.name} (#${outlet.id})`)

    const departments = await prisma.outlet_department.findMany({
      where: { outlet_id: OUTLET_ID },
      orderBy: { name: 'asc' },
      include: { configs: { select: { email: true } } },
    })
    console.log(`Found ${departments.length} department(s)\n`)

    const name = (user.name || user.email).trim()
    const email = user.email.trim().toLowerCase()

    let created = 0
    let skipped = 0

    for (const dept of departments) {
      const alreadyMapped = dept.configs.some(
        (c) => c.email.toLowerCase() === email
      )
      if (alreadyMapped) {
        console.log(`- ${dept.name}: already mapped, skipping`)
        skipped++
        continue
      }

      await prisma.$transaction(async (tx) => {
        await tx.department_config.create({
          data: {
            outlet_department_id: dept.id,
            name,
            email,
            type: CONTACT_TYPE,
            whatsapp_number: [],
            is_active: true,
            user_id: user.id,
          },
        })

        await tx.user_department_subscription.upsert({
          where: {
            user_id_outlet_department_id: {
              user_id: user.id,
              outlet_department_id: dept.id,
            },
          },
          create: { user_id: user.id, outlet_department_id: dept.id },
          update: {},
        })
      })

      console.log(`- ${dept.name}: mapped`)
      created++
    }

    console.log(`\nDone. Mapped ${created} department(s), skipped ${skipped} already-mapped.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
