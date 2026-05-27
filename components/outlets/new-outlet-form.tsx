'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createOutlet } from '@/lib/actions/outlets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface Restaurant {
  id: number
  restaurant_name: string | null
}

interface NewOutletFormProps {
  restaurants: Restaurant[]
  preselectedRestaurantId?: number
}

const outletSchema = z.object({
  name: z.string().min(1, 'Outlet name is required'),
  restaurant_id: z.string().min(1, 'Restaurant is required'),
  location: z.string().optional(),
  region: z.string().optional(),
  branchCode: z.string().optional(),
})

type OutletInput = z.infer<typeof outletSchema>

export function NewOutletForm({
  restaurants,
  preselectedRestaurantId,
}: NewOutletFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<OutletInput>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: '',
      restaurant_id: preselectedRestaurantId?.toString() || '',
      location: '',
      region: '',
      branchCode: '',
    },
  })

  const handleSubmit = async (data: OutletInput) => {
    setError(null)
    startTransition(async () => {
      const result = await createOutlet({
        name: data.name,
        restaurant_id: parseInt(data.restaurant_id, 10),
        location: data.location || null,
        region: data.region || null,
        branchCode: data.branchCode || null,
        managerNames: [],
        serverNames: [],
        departments: [],
      })

      if (result.success && result.data) {
        router.push(`/outlets/${(result.data as { id: number }).id}`)
      } else {
        setError(result.error || 'Failed to create outlet')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outlet Details</CardTitle>
        <CardDescription>Enter the details for the new outlet</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="restaurant_id">
              Restaurant <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch('restaurant_id')}
              onValueChange={(value) => form.setValue('restaurant_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem
                    key={restaurant.id}
                    value={restaurant.id.toString()}
                  >
                    {restaurant.restaurant_name || 'Unnamed Restaurant'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.restaurant_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.restaurant_id.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              Outlet Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Enter outlet name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...form.register('location')}
              placeholder="Enter location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                {...form.register('region')}
                placeholder="Enter region"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="branchCode">Branch Code</Label>
              <Input
                id="branchCode"
                {...form.register('branchCode')}
                placeholder="Enter code"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Outlet'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
