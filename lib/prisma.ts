import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

// Managed Postgres hosts enforce TLS with certs signed by their own CA (not in
// Node's default trust store), and node-postgres doesn't negotiate TLS by
// default the way psql does — so TLS is requested explicitly and verified
// against the matching CA instead of skipping verification. Unknown hosts fall
// through to the driver defaults (i.e. whatever the connection string says).
function caFileForHost(url: string): string | undefined {
  const host = url.split('@').pop()!.split(/[:/?]/)[0]
  if (host.endsWith('.rds.amazonaws.com')) return 'rds-ca-bundle.pem'
  if (host.endsWith('.supabase.com') || host.endsWith('.supabase.co')) {
    return 'supabase-ca.crt'
  }
  return undefined
}

const caFile = caFileForHost(connectionString)

const adapter = new PrismaPg({
  connectionString,
  ...(caFile && {
    ssl: {
      ca: readFileSync(join(process.cwd(), 'certs', caFile), 'utf8'),
      rejectUnauthorized: true,
    },
  }),
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
