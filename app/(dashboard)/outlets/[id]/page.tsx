import { notFound } from 'next/navigation'
import { getOutlet } from '@/lib/actions/outlets'
import { OutletWorkspace } from '@/components/outlet-workspace/outlet-workspace'

interface OutletPageProps {
  params: Promise<{ id: string }>
}

export default async function OutletPage({ params }: OutletPageProps) {
  const { id } = await params
  const outletId = parseInt(id, 10)

  if (isNaN(outletId)) {
    notFound()
  }

  const outlet = await getOutlet(outletId)

  if (!outlet) {
    notFound()
  }

  return <OutletWorkspace outlet={outlet} />
}
