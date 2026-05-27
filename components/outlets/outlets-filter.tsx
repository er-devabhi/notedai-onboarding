'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, Building2 } from 'lucide-react'

interface Restaurant {
  id: number
  restaurant_name: string | null
}

interface OutletsFilterProps {
  restaurants: Restaurant[]
  selectedRestaurantId?: number
}

export function OutletsFilter({
  restaurants,
  selectedRestaurantId,
}: OutletsFilterProps) {
  const router = useRouter()

  const handleRestaurantChange = (value: string) => {
    if (value === 'all') {
      router.push('/outlets')
    } else {
      router.push(`/outlets?restaurant_id=${value}`)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search outlets..." className="pl-10" />
      </div>

      <Select
        value={selectedRestaurantId?.toString() || 'all'}
        onValueChange={handleRestaurantChange}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <Building2 className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All restaurants" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Restaurants</SelectItem>
          {restaurants.map((restaurant) => (
            <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
              {restaurant.restaurant_name || 'Unnamed'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
