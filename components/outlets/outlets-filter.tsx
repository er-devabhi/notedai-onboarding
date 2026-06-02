'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
}

export function OutletsFilter({ restaurants }: OutletsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('search') ?? ''
  const currentRestaurantId = searchParams.get('restaurant_id') ?? 'all'

  const [searchValue, setSearchValue] = useState(currentSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local search in sync when navigating back/forward
  useEffect(() => {
    setSearchValue(currentSearch)
  }, [currentSearch])

  const buildUrl = useCallback(
    (search: string, restaurantId: string) => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (restaurantId !== 'all') params.set('restaurant_id', restaurantId)
      const qs = params.toString()
      return qs ? `/outlets?${qs}` : '/outlets'
    },
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl(value, currentRestaurantId))
    }, 400)
  }

  const handleRestaurantChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.push(buildUrl(searchValue, value))
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search outlets..."
          className="pl-10"
        />
      </div>

      <Select value={currentRestaurantId} onValueChange={handleRestaurantChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <Building2 className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All Organizations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Organizations</SelectItem>
          {restaurants.map((r) => (
            <SelectItem key={r.id} value={r.id.toString()}>
              {r.restaurant_name || 'Unnamed'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
