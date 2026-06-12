'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateOutlet } from '@/lib/actions/outlets'
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
import { Loader2, Save, X, Plus } from 'lucide-react'
import type { OutletWithRelations } from '@/types'

interface GeneralInfoTabProps {
  outlet: OutletWithRelations
}

const generalInfoSchema = z.object({
  name: z.string().min(1, 'Outlet name is required'),
  location: z.string().optional(),
  region: z.string().optional(),
  branchCode: z.string().optional(),
})

type GeneralInfoInput = z.infer<typeof generalInfoSchema>

export function GeneralInfoTab({ outlet }: GeneralInfoTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Multi-value fields
  const [managerNames, setManagerNames] = useState<string[]>(
    outlet.managerNames || []
  )
  const [serverNames, setServerNames] = useState<string[]>(
    outlet.serverNames || []
  )
  const [departments, setDepartments] = useState<string[]>(
    outlet.departments || []
  )

  const form = useForm<GeneralInfoInput>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: {
      name: outlet.name,
      location: outlet.location || '',
      region: outlet.region || '',
      branchCode: outlet.branchCode || '',
    },
  })

  const handleSubmit = async (data: GeneralInfoInput) => {
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateOutlet(outlet.id, {
        name: data.name,
        location: data.location || null,
        region: data.region || null,
        branchCode: data.branchCode || null,
        managerNames,
        serverNames,
        departments,
        restaurant_id: outlet.restaurant_id,
      })

      if (result.success) {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to update outlet')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Information</CardTitle>
        <CardDescription>Update outlet details and configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder="Enter branch code"
              />
            </div>
          </div>

          {/* Multi-value fields */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MultiValueInput
              label="Manager Names"
              values={managerNames}
              onChange={setManagerNames}
              placeholder="Add manager name"
              hint='Tip: paste a JSON array, e.g. ["John", "Jane"], to add multiple at once'
            />
            <MultiValueInput
              label="Server Names"
              values={serverNames}
              onChange={setServerNames}
              placeholder="Add server name"
              hint='------'
            />
            <MultiValueInput
              label="Departments"
              values={departments}
              onChange={setDepartments}
              placeholder="Add department"
              hint='Tip: paste a JSON array, e.g. ["HK", "F&B", "IT"], to add multiple at once'
            />
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
              <p className="text-sm text-green-600">
                Outlet updated successfully
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

interface MultiValueInputProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
  hint?: string
}

function MultiValueInput({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: MultiValueInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    // Support pasting a stringified JSON array to add multiple values at once
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          const newValues = parsed
            .map((item) => String(item).trim())
            .filter((item) => item && !values.includes(item))
          const deduped = Array.from(new Set(newValues))
          if (deduped.length > 0) {
            onChange([...values, ...deduped])
            setInputValue('')
            return
          }
        }
      } catch {
        // Not valid JSON, fall through to single-value add
      }
    }

    if (!values.includes(trimmed)) {
      onChange([...values, trimmed])
      setInputValue('')
    }
  }

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
            >
              {value}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
