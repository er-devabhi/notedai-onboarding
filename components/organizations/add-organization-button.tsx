'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOrganization } from '@/lib/actions/organizations'
import {
  organizationSchema,
  type OrganizationInput,
} from '@/components/organizations/organization-edit-form'
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

interface AddOrganizationButtonProps {
  defaultType?: 'RESTAURANT' | 'HOSPITAL'
  variant?: 'default' | 'outline'
  className?: string
}

export function AddOrganizationButton({
  defaultType = 'HOSPITAL',
  variant = 'default',
  className,
}: AddOrganizationButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      restaurant_name: '',
      organizationType: defaultType,
    },
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset()
      setError(null)
    }
    setOpen(next)
  }

  const handleSubmit = (data: OrganizationInput) => {
    setError(null)
    startTransition(async () => {
      const result = await createOrganization(data)
      if (result.success && result.data) {
        setOpen(false)
        router.push(`/organizations/${(result.data as { id: number }).id}`)
        router.refresh()
      } else {
        setError(result.error || 'Failed to create organization')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle>New Organization</DialogTitle>
            <DialogDescription>
              Enter the details for the new organization.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="org-name">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="org-name"
                {...form.register('restaurant_name')}
                placeholder="Enter organization name"
                autoFocus
              />
              {form.formState.errors.restaurant_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.restaurant_name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="org-type">Type</Label>
              <Select
                value={form.watch('organizationType')}
                onValueChange={(v) =>
                  form.setValue(
                    'organizationType',
                    v as 'RESTAURANT' | 'HOSPITAL',
                  )
                }
              >
                <SelectTrigger id="org-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                  <SelectItem value="HOSPITAL">Hospital</SelectItem>
                </SelectContent>
              </Select>
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
                'Create Organization'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
