'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserRole } from '@prisma/client'
import {
  escalationLevelSchema,
  slaPriorities,
  type EscalationLevelInput,
} from '@/lib/validations'
import {
  createEscalationLevel,
  updateEscalationLevel,
  toggleEscalationLevelActive,
} from '@/lib/actions/escalation-levels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Loader2, Plus, Pencil, X, Check, Layers } from 'lucide-react'
import { toast } from 'sonner'
import type { EscalationLevel } from '@/types'

interface EscalationLevelTabProps {
  outletId: number
  levels: EscalationLevel[]
}

// Legacy rows may have inconsistently-cased keys (e.g. "hIGH", "MEDIUM") from
// before the SLA labels were locked to Low/Medium/High — normalize on read.
// sla_config is a Prisma Json column, so it may not even be object-shaped.
function normalizeSlaConfig(
  config: unknown
): EscalationLevelInput['sla_config'] {
  const lower: Record<string, number> = {}
  if (typeof config === 'object' && config !== null && !Array.isArray(config)) {
    for (const [key, value] of Object.entries(config)) {
      lower[key.toLowerCase()] =
        typeof value === 'number' ? value : Number(value) || 0
    }
  }
  return {
    Low: lower.low ?? 0,
    Medium: lower.medium ?? 0,
    High: lower.high ?? 0,
  }
}

// field_config is a raw JSON passthrough — displayed as-typed, "NULL" when unset.
function formatFieldConfig(fieldConfig: unknown): string {
  if (fieldConfig === null || fieldConfig === undefined) return 'NULL'
  return JSON.stringify(fieldConfig)
}

const emptyDefaults: EscalationLevelInput = {
  key: '',
  name: '',
  role: 'DEPARTMENT',
  sequence: 0,
  is_active: true,
  field_config: null,
  sla_config: { Low: 0, Medium: 0, High: 0 },
}

export function EscalationLevelTab({
  outletId,
  levels,
}: EscalationLevelTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<EscalationLevel | null>(
    null
  )

  const createForm = useForm<EscalationLevelInput>({
    resolver: zodResolver(escalationLevelSchema),
    defaultValues: { ...emptyDefaults, sequence: levels.length },
  })

  const editForm = useForm<EscalationLevelInput>({
    resolver: zodResolver(escalationLevelSchema),
    defaultValues: emptyDefaults,
  })

  const openCreateDialog = () => {
    setError(null)
    createForm.reset({ ...emptyDefaults, sequence: levels.length })
    setIsCreateOpen(true)
  }

  const openEditDialog = (level: EscalationLevel) => {
    setError(null)
    editForm.reset({
      key: level.key,
      name: level.name,
      role: level.role,
      sequence: level.sequence,
      is_active: level.is_active,
      field_config:
        level.field_config === null || level.field_config === undefined
          ? null
          : JSON.stringify(level.field_config, null, 2),
      sla_config: normalizeSlaConfig(level.sla_config),
    })
    setEditingLevel(level)
  }

  const handleCreate = (data: EscalationLevelInput) => {
    setError(null)
    startTransition(async () => {
      const result = await createEscalationLevel(outletId, data)
      if (result.success) {
        setIsCreateOpen(false)
        router.refresh()
        toast.success('Escalation level created')
      } else {
        setError(result.error || 'Failed to create escalation level')
      }
    })
  }

  const handleEdit = (data: EscalationLevelInput) => {
    if (!editingLevel) return
    setError(null)
    startTransition(async () => {
      const result = await updateEscalationLevel(
        editingLevel.id,
        outletId,
        data
      )
      if (result.success) {
        setEditingLevel(null)
        router.refresh()
        toast.success('Escalation level updated')
      } else {
        setError(result.error || 'Failed to update escalation level')
      }
    })
  }

  const handleToggleActive = (level: EscalationLevel) => {
    startTransition(async () => {
      const result = await toggleEscalationLevelActive(level.id, outletId)
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Escalation Levels</CardTitle>
            <CardDescription>
              {levels.length} level{levels.length !== 1 ? 's' : ''} · define
              the escalation sequence, owning role, and SLA per level
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Level
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto z-200">
              <form onSubmit={createForm.handleSubmit(handleCreate)}>
                <DialogHeader>
                  <DialogTitle>Create Escalation Level</DialogTitle>
                  <DialogDescription>
                    Add a new escalation level for this outlet
                  </DialogDescription>
                </DialogHeader>
                <EscalationLevelFormFields form={createForm} idPrefix="create" />
                {error && (
                  <p className="mt-2 text-sm text-destructive">{error}</p>
                )}
                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
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
                      'Create Level'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {levels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">
              No escalation levels yet
            </p>
            <p className="text-sm text-muted-foreground">
              Add a level to start building the escalation sequence
            </p>
          </div>
        ) : (
          <div className="overflow-auto rounded-lg border">
            <table className="w-full min-w-200 border-collapse text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium w-16">
                    Seq
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Key</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Role</th>
                  <th className="px-3 py-2 text-left font-medium">
                    SLA (mins)
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Field Config
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Active</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level) => {
                  const sla = normalizeSlaConfig(level.sla_config)
                  return (
                    <tr
                      key={level.id}
                      className={!level.is_active ? 'bg-muted/10' : ''}
                    >
                      <td className="border-t px-3 py-2 align-top">
                        {level.sequence}
                      </td>
                      <td className="border-t px-3 py-2 align-top font-mono text-xs">
                        {level.key}
                      </td>
                      <td className="border-t px-3 py-2 align-top font-medium">
                        {level.name}
                      </td>
                      <td className="border-t px-3 py-2 align-top">
                        <Badge variant="secondary">
                          {level.role.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="border-t px-3 py-2 align-top">
                        <div className="flex flex-wrap gap-1">
                          {slaPriorities.map((priority) => (
                            <Badge
                              key={priority}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {priority}: {sla[priority]}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="border-t px-3 py-2 align-top max-w-48">
                        <span
                          className="block truncate font-mono text-xs text-muted-foreground"
                          title={formatFieldConfig(level.field_config)}
                        >
                          {formatFieldConfig(level.field_config)}
                        </span>
                      </td>
                      <td className="border-t px-3 py-2 align-top">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(level)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1"
                        >
                          {level.is_active ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-muted text-muted-foreground"
                            >
                              <X className="mr-1 h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="border-t px-3 py-2 align-top text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(level)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={!!editingLevel}
          onOpenChange={(open) => !open && setEditingLevel(null)
          }
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto z-200">
            <form onSubmit={editForm.handleSubmit(handleEdit)}>
              <DialogHeader>
                <DialogTitle>Edit Escalation Level</DialogTitle>
                <DialogDescription>
                  Update the escalation level details
                </DialogDescription>
              </DialogHeader>
              <EscalationLevelFormFields form={editForm} idPrefix="edit" />
              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLevel(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {error && !isCreateOpen && !editingLevel && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Shared create/edit form fields ──────────────────────────────────────────

function EscalationLevelFormFields({
  form,
  idPrefix,
}: {
  form: ReturnType<typeof useForm<EscalationLevelInput>>
  idPrefix: string
}) {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-key`}>
            Key <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-key`}
            {...form.register('key')}
            placeholder="e.g., SE"
            autoFocus
          />
          {form.formState.errors.key && (
            <p className="text-sm text-destructive">
              {form.formState.errors.key.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-sequence`}>
            Sequence <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-sequence`}
            type="number"
            {...form.register('sequence', { valueAsNumber: true })}
            min={0}
          />
          {form.formState.errors.sequence && (
            <p className="text-sm text-destructive">
              {form.formState.errors.sequence.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-name`}
          {...form.register('name')}
          placeholder="e.g., Service Excellence"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Role <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.watch('role')}
          onValueChange={(v) =>
            form.setValue('role', v as EscalationLevelInput['role'], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(UserRole).map((role) => (
              <SelectItem key={role} value={role}>
                {role.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.role && (
          <p className="text-sm text-destructive">
            {form.formState.errors.role.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted-foreground">
            Inactive levels are skipped in escalation flows
          </p>
        </div>
        <Switch
          checked={form.watch('is_active')}
          onCheckedChange={(c) =>
            form.setValue('is_active', c, { shouldValidate: true })
          }
        />
      </div>

      <FieldConfigEditor form={form} idPrefix={idPrefix} />

      <div className="flex flex-col gap-2">
        <Label>SLA (minutes per priority)</Label>
        <div className="grid grid-cols-3 gap-2">
          {slaPriorities.map((priority) => (
            <div key={priority} className="flex flex-col gap-1">
              <Label
                htmlFor={`${idPrefix}-sla-${priority}`}
                className="text-xs text-muted-foreground"
              >
                {priority}
              </Label>
              <Input
                id={`${idPrefix}-sla-${priority}`}
                type="number"
                {...form.register(`sla_config.${priority}`, {
                  valueAsNumber: true,
                })}
                min={0}
              />
              {form.formState.errors.sla_config?.[priority] && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.sla_config[priority]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── field_config: raw JSON passthrough, editable like a table-editor jsonb cell ──

function FieldConfigEditor({
  form,
  idPrefix,
}: {
  form: ReturnType<typeof useForm<EscalationLevelInput>>
  idPrefix: string
}) {
  const value = form.watch('field_config')
  const isNull = value === null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={`${idPrefix}-field-config`}>field_config jsonb</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() =>
            form.setValue('field_config', isNull ? '' : null, {
              shouldValidate: true,
            })
          }
        >
          {isNull ? 'Edit' : 'Set to NULL'}
        </Button>
      </div>
      {isNull ? (
        <div className="rounded-md border px-3 py-2 font-mono text-sm text-muted-foreground">
          NULL
        </div>
      ) : (
        <Textarea
          id={`${idPrefix}-field-config`}
          value={value ?? ''}
          onChange={(e) =>
            form.setValue('field_config', e.target.value, {
              shouldValidate: true,
            })
          }
          rows={4}
          spellCheck={false}
          placeholder='{"allow_resolve": false}'
          className="font-mono text-sm"
        />
      )}
      {form.formState.errors.field_config && (
        <p className="text-sm text-destructive">
          {form.formState.errors.field_config.message}
        </p>
      )}
    </div>
  )
}
