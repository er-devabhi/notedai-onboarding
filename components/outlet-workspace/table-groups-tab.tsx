'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  createTableGroup,
  updateTableGroup,
  deleteTableGroup,
} from '@/lib/actions/table-groups'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, Plus, Pencil, Trash2, GripVertical, ArrowUpDown, Upload } from 'lucide-react'
import type { TableGroup } from '@/types'
import { BulkUploadDialog } from './bulk-upload-dialog'

interface TableGroupsTabProps {
  outletId: number
  tableGroups: TableGroup[]
}

const tableGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  order: z.number().int().min(0).default(0),
})

type TableGroupInput = z.infer<typeof tableGroupSchema>

export function TableGroupsTab({
  outletId,
  tableGroups,
}: TableGroupsTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TableGroup | null>(null)
  const [isBulkOpen, setIsBulkOpen] = useState(false)

  const createForm = useForm<TableGroupInput>({
    resolver: zodResolver(tableGroupSchema),
    defaultValues: { name: '', order: tableGroups.length },
  })

  const editForm = useForm<TableGroupInput>({
    resolver: zodResolver(tableGroupSchema),
  })

  const handleCreate = async (data: TableGroupInput) => {
    setError(null)
    startTransition(async () => {
      const result = await createTableGroup({
        name: data.name,
        order: data.order,
        outlet_id: outletId,
      })

      if (result.success) {
        setIsCreateOpen(false)
        createForm.reset({ name: '', order: tableGroups.length + 1 })
        router.refresh()
      } else {
        setError(result.error || 'Failed to create table group')
      }
    })
  }

  const handleEdit = async (data: TableGroupInput) => {
    if (!editingGroup) return
    setError(null)

    startTransition(async () => {
      const result = await updateTableGroup(editingGroup.id, {
        name: data.name,
        order: data.order,
      })

      if (result.success) {
        setEditingGroup(null)
        router.refresh()
      } else {
        setError(result.error || 'Failed to update table group')
      }
    })
  }

  const handleDelete = async (groupId: number) => {
    setError(null)
    startTransition(async () => {
      const result = await deleteTableGroup(groupId)

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'Failed to delete table group')
      }
    })
  }

  const handleResetOrder = () => {
    setError(null)
    const sorted = [...tableGroups].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    startTransition(async () => {
      const results = await Promise.all(
        sorted.map((group, i) => updateTableGroup(group.id, { order: i }))
      )
      const failed = results.find((r) => !r.success)
      if (failed) {
        setError(failed.error || 'Failed to reset order')
      } else {
        router.refresh()
      }
    })
  }

  const openEditDialog = (group: TableGroup) => {
    setEditingGroup(group)
    editForm.reset({ name: group.name, order: group.order })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Table Groups</CardTitle>
            <CardDescription>
              Organize tables into groups (e.g., floors, sections)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkOpen(true)}
              disabled={isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button
              variant="outline"
              onClick={handleResetOrder}
              disabled={isPending || tableGroups.length < 2}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Reset Order
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={createForm.handleSubmit(handleCreate)}>
                <DialogHeader>
                  <DialogTitle>Create Table Group</DialogTitle>
                  <DialogDescription>
                    Add a new table group to organize your tables
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="create-name">
                      Group Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="create-name"
                      {...createForm.register('name')}
                      placeholder="e.g., 1st Floor, Main Hall"
                      autoFocus
                    />
                    {createForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="create-order">Display Order</Label>
                    <Input
                      id="create-order"
                      type="number"
                      {...createForm.register('order', { valueAsNumber: true })}
                      min={0}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
                <DialogFooter>
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
                      'Create Group'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tableGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No table groups yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first group to organize tables
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tableGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{group.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {group._count?.tables || 0} tables - Order: {group.order}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(group)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={
                          (group._count?.tables || 0) > 0 || isPending
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Table Group</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{group.name}
                          &quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(group.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
        >
          <DialogContent>
            <form onSubmit={editForm.handleSubmit(handleEdit)}>
              <DialogHeader>
                <DialogTitle>Edit Table Group</DialogTitle>
                <DialogDescription>
                  Update the table group details
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-name">
                    Group Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    {...editForm.register('name')}
                    placeholder="e.g., 1st Floor"
                    autoFocus
                  />
                  {editForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {editForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-order">Display Order</Label>
                  <Input
                    id="edit-order"
                    type="number"
                    {...editForm.register('order', { valueAsNumber: true })}
                    min={0}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingGroup(null)}
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

        {/* Global error display */}
        {error && !isCreateOpen && !editingGroup && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Bulk Upload Dialog */}
        <BulkUploadDialog
          outletId={outletId}
          open={isBulkOpen}
          onOpenChange={setIsBulkOpen}
        />
      </CardContent>
    </Card>
  )
}
