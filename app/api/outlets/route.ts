import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const restaurantId = searchParams.get('restaurant_id')

  if (!restaurantId) {
    return NextResponse.json({ outlets: [] })
  }

  try {
    const outlets = await prisma.outlet.findMany({
      where: { restaurant_id: parseInt(restaurantId, 10) },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    })

    return NextResponse.json({ outlets })
  } catch (error) {
    console.error('[v0] Error fetching outlets:', error)
    return NextResponse.json({ outlets: [] }, { status: 500 })
  }
}
