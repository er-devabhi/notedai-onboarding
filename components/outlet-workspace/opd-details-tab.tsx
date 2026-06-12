'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createStaff, updateStaff, deleteStaff } from '@/lib/actions/staffs'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Pencil, Trash2, Upload, Stethoscope, Check, X } from 'lucide-react'
import { BulkUploadStaffsDialog } from './bulk-upload-staffs-dialog'
import type { Staff, TableGroup } from '@/types'

interface OpdDetailsTabProps {
  outletId: number
  staffs: Staff[]
  tableGroups: TableGroup[]
}

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  department: z.string().optional(),
  opd_name: z.string().optional(),
  group_id: z.string().optional(),
})

type StaffInput = z.infer<typeof staffSchema>

// Inline-edit draft for a single staff row
interface RowDraft {
  name: string
  department: string
  opd_name: string
  group_id: string
}

export function OpdDetailsTab({ outletId, staffs, tableGroups }: OpdDetailsTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)

  // Inline row editing
  const [editingRowId, setEditingRowId] = useState<number | null>(null)
  const [rowDraft, setRowDraft] = useState<RowDraft | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)

  const createForm = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: '', department: '', opd_name: '', group_id: 'none' },
  })

  const handleCreate = async (data: StaffInput) => {
    setError(null)
    startTransition(async () => {
      const result = await createStaff({
        name: data.name.trim(),
        outlet_id: outletId,
        group_id:
          data.group_id && data.group_id !== 'none'
            ? parseInt(data.group_id, 10)
            : null,
        department: data.department?.trim() || null,
        opd_name: data.opd_name?.trim() || null,
      })

      if (result.success) {
        setIsCreateOpen(false)
        createForm.reset({ name: '', department: '', opd_name: '', group_id: 'none' })
        router.refresh()
      } else {
        setError(result.error || 'Failed to add staff')
      }
    })
  }

  const startEditRow = (staff: Staff) => {
    setRowError(null)
    setEditingRowId(staff.id)
    setRowDraft({
      name: staff.name,
      department: staff.department || '',
      opd_name: staff.opd_name || '',
      group_id: staff.group_id ? String(staff.group_id) : 'none',
    })
  }

  const cancelEditRow = () => {
    setEditingRowId(null)
    setRowDraft(null)
    setRowError(null)
  }

  const saveEditRow = (staffId: number) => {
    if (!rowDraft) return
    if (!rowDraft.name.trim()) {
      setRowError('Name is required')
      return
    }
    setRowError(null)
    startTransition(async () => {
      const result = await updateStaff(staffId, {
        name: rowDraft.name.trim(),
        group_id:
          rowDraft.group_id && rowDraft.group_id !== 'none'
            ? parseInt(rowDraft.group_id, 10)
            : null,
        department: rowDraft.department.trim() || null,
        opd_name: rowDraft.opd_name.trim() || null,
      })

      if (result.success) {
        cancelEditRow()
        router.refresh()
      } else {
        setRowError(result.error || 'Failed to update staff')
      }
    })
  }

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteStaff(id)
      if (result.success) {
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>OPD Details</CardTitle>
            <CardDescription>
              Manage hospital staff assigned to OPDs in this outlet
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
            <Dialog
              open={isCreateOpen}
              onOpenChange={(open) => {
                setIsCreateOpen(open)
                if (open) {
                  createForm.reset({
                    name: '',
                    department: '',
                    opd_name: '',
                    group_id: 'none',
                  })
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={createForm.handleSubmit(handleCreate)}>
                  <DialogHeader>
                    <DialogTitle>Add OPD Staff</DialogTitle>
                    <DialogDescription>
                      Add a new staff member and assign them to an OPD/group
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="create-name">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="create-name"
                        {...createForm.register('name')}
                        placeholder="Enter staff name"
                        autoFocus
                      />
                      {createForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {createForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="create-department">Department</Label>
                      <Input
                        id="create-department"
                        {...createForm.register('department')}
                        placeholder="e.g. Cardiology"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="create-opd-name">OPD Name</Label>
                      <Input
                        id="create-opd-name"
                        {...createForm.register('opd_name')}
                        placeholder="e.g. Cardiology OPD"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="create-group">Group</Label>
                      <Select
                        value={createForm.watch('group_id')}
                        onValueChange={(value) =>
                          createForm.setValue('group_id', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No group</SelectItem>
                          {tableGroups.map((group) => (
                            <SelectItem key={group.id} value={String(group.id)}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          Adding...
                        </>
                      ) : (
                        'Add Staff'
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
        {staffs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Stethoscope className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No OPD staff added yet</p>
            <p className="text-sm text-muted-foreground">
              Add staff individually or use bulk upload to add many at once
            </p>
          </div>
        ) : (
          <div className="overflow-auto rounded-lg border">
            <table className="w-full min-w-160 border-collapse text-sm">
              <thead className="border-b border-gray-200 bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Department</th>
                  <th className="px-3 py-2 text-left font-medium">OPD Name</th>
                  <th className="px-3 py-2 text-left font-medium">Group</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffs.map((staff) => {
                  const isEditing = editingRowId === staff.id
                  return (
                    <tr key={staff.id}>
                      {/* Name */}
                      <td className="border-t px-3 py-2 align-top">
                        {isEditing ? (
                          <Input
                            value={rowDraft?.name ?? ''}
                            onChange={(e) =>
                              setRowDraft((d) =>
                                d ? { ...d, name: e.target.value } : d
                              )
                            }
                            className="h-8 min-w-40"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{staff.name}</span>
                        )}
                      </td>

                      {/* Department */}
                      <td className="border-t px-3 py-2 align-top">
                        {isEditing ? (
                          <Input
                            value={rowDraft?.department ?? ''}
                            onChange={(e) =>
                              setRowDraft((d) =>
                                d ? { ...d, department: e.target.value } : d
                              )
                            }
                            placeholder="e.g. Cardiology"
                            className="h-8 min-w-36"
                          />
                        ) : staff.department ? (
                          staff.department
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* OPD Name */}
                      <td className="border-t px-3 py-2 align-top">
                        {isEditing ? (
                          <Input
                            value={rowDraft?.opd_name ?? ''}
                            onChange={(e) =>
                              setRowDraft((d) =>
                                d ? { ...d, opd_name: e.target.value } : d
                              )
                            }
                            placeholder="e.g. Cardiology OPD"
                            className="h-8 min-w-36"
                          />
                        ) : staff.opd_name ? (
                          <span className="text-muted-foreground">{staff.opd_name}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Group */}
                      <td className="border-t px-3 py-2 align-top">
                        {isEditing ? (
                          <Select
                            value={rowDraft?.group_id ?? 'none'}
                            onValueChange={(value) =>
                              setRowDraft((d) => (d ? { ...d, group_id: value } : d))
                            }
                          >
                            <SelectTrigger className="h-8 min-w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No group</SelectItem>
                              {tableGroups.map((group) => (
                                <SelectItem key={group.id} value={String(group.id)}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : staff.table_group ? (
                          staff.table_group.name
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="border-t px-3 py-2 align-top text-right">
                        {isEditing ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => saveEditRow(staff.id)}
                                disabled={isPending}
                              >
                                {isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                                <span className="sr-only">Save</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelEditRow}
                                disabled={isPending}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cancel</span>
                              </Button>
                            </div>
                            {rowError && (
                              <p className="max-w-48 text-right text-xs text-destructive">
                                {rowError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditRow(staff)}
                              disabled={isPending || editingRowId !== null}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isPending || editingRowId !== null}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Staff</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove {staff.name} from
                                    this outlet.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(staff.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bulk Upload Dialog */}
        <BulkUploadStaffsDialog
          outletId={outletId}
          open={isBulkOpen}
          onOpenChange={setIsBulkOpen}
        />
      </CardContent>
    </Card>
  )
}
