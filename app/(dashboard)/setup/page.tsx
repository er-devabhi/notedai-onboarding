import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { SetupWizard } from '@/components/setup/setup-wizard'

async function getRestaurants() {
  const restaurants = await prisma.restaurants.findMany({
    orderBy: { restaurant_name: 'asc' },
    select: {
      id: true,
      restaurant_name: true,
      organizationType: true,
    },
  })
  return restaurants
}

export default async function SetupPage() {
  const restaurants = await getRestaurants()

  return (
    <div className="mx-auto max-w-2xl">
      <Suspense fallback={<SetupWizardSkeleton />}>
        <SetupWizard restaurants={restaurants} />
      </Suspense>
    </div>
  )
}

function SetupWizardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-lg border bg-muted" />
    </div>
  )
}
