'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function RestaurantsSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('search') ?? ''
  const [searchValue, setSearchValue] = useState(currentSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stay in sync with URL on back/forward navigation
  useEffect(() => {
    setSearchValue(currentSearch)
  }, [currentSearch])

  const buildUrl = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
      const qs = params.toString()
      return qs ? `?${qs}` : '?'
    },
    [searchParams]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl(value))
    }, 400)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={searchValue}
        onChange={handleChange}
        placeholder="Search organizations..."
        className="pl-10"
      />
    </div>
  )
}
