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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'

interface Restaurant {
  id: number
  restaurant_name: string | null
}

interface AddOutletButtonProps {
  restaurants: Restaurant[]
  preselectedRestaurantId?: number
  variant?: 'default' | 'outline'
  className?: string
  label?: string
}

const outletSchema = z.object({
  name: z.string().min(1, 'Outlet name is required'),
  restaurant_id: z.string().min(1, 'Restaurant is required'),
  location: z.string().optional(),
  region: z.string().optional(),
  branchCode: z.string().optional(),
})

type OutletInput = z.infer<typeof outletSchema>

export function AddOutletButton({
  restaurants,
  preselectedRestaurantId,
  variant = 'default',
  className,
  label = 'Add Outlet',
}: AddOutletButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset()
      setError(null)
    }
    setOpen(next)
  }

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
        setOpen(false)
        router.push(`/outlets/${(result.data as { id: number }).id}`)
      } else {
        setError(result.error || 'Failed to create outlet')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          <Plus className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle>New Outlet</DialogTitle>
            <DialogDescription>
              Enter the details for the new outlet.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="restaurant_id">
                Organization <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch('restaurant_id')}
                onValueChange={(value) => form.setValue('restaurant_id', value)}
              >
                <SelectTrigger className='w-full' id="restaurant_id">
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent className='w-full max-h-60 overflow-y-auto'>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.restaurant_name || 'Unnamed Organization'}
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
                autoFocus
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Outlet'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
