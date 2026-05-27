'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createTable, updateTable, toggleTableActive } from '@/lib/actions/tables'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil } from 'lucide-react'
import type { Table, TableGroup } from '@/types'

interface TablesTabProps {
  outletId: number
  tables: Table[]
  tableGroups: TableGroup[]
}

const tableSchema = z.object({
  table_no: z.string().min(1, 'Table number is required'),
  group_id: z.string().optional(),
  capacity: z.string().optional(),
  order: z.number().int().min(0).default(0),
})

type TableFormInput = z.infer<typeof tableSchema>

export function TablesTab({ outletId, tables, tableGroups }: TablesTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)

  const createForm = useForm<TableFormInput>({
    resolver: zodResolver(tableSchema),
    defaultValues: { table_no: '', group_id: '', capacity: '', order: tables.length },
  })

  const editForm = useForm<TableFormInput>({
    resolver: zodResolver(tableSchema),
  })

  const handleCreate = async (data: TableFormInput) => {
    setError(null)
    startTransition(async () => {
      const result = await createTable({
        table_no: data.table_no,
        outlet_id: outletId,
        group_id: data.group_id ? parseInt(data.group_id, 10) : null,
        capacity: data.capacity ? parseInt(data.capacity, 10) : null,
        order: data.order,
        active: true,
      })

      if (result.success) {
        setIsCreateOpen(false)
        createForm.reset({ table_no: '', group_id: '', capacity: '', order: tables.length + 1 })
        router.refresh()
      } else {
        setError(result.error || 'Failed to create table')
      }
    })
  }

  const handleEdit = async (data: TableFormInput) => {
    if (!editingTable) return
    setError(null)

    startTransition(async () => {
      const result = await updateTable(editingTable.id, {
        table_no: data.table_no,
        group_id: data.group_id ? parseInt(data.group_id, 10) : null,
        capacity: data.capacity ? parseInt(data.capacity, 10) : null,
        order: data.order,
      })

      if (result.success) {
        setEditingTable(null)
        router.refresh()
      } else {
        setError(result.error || 'Failed to update table')
      }
    })
  }

  const handleToggleActive = async (tableId: number) => {
    startTransition(async () => {
      const result = await toggleTableActive(tableId)
      if (result.success) {
        router.refresh()
      }
    })
  }

  const openEditDialog = (table: Table) => {
    setEditingTable(table)
    editForm.reset({
      table_no: table.table_no,
      group_id: table.group_id?.toString() || '',
      capacity: table.capacity?.toString() || '',
      order: table.order,
    })
  }

  // Group tables by their group
  const groupedTables = tableGroups.map((group) => ({
    group,
    tables: tables.filter((t) => t.group_id === group.id),
  }))
  const ungroupedTables = tables.filter((t) => !t.group_id)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tables</CardTitle>
            <CardDescription>
              Manage tables and their assignments
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={createForm.handleSubmit(handleCreate)}>
                <DialogHeader>
                  <DialogTitle>Create Table</DialogTitle>
                  <DialogDescription>
                    Add a new table to this outlet
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="create-table_no">
                      Table Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="create-table_no"
                      {...createForm.register('table_no')}
                      placeholder="e.g., T1, A1, 101"
                      autoFocus
                    />
                    {createForm.formState.errors.table_no && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.table_no.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="create-group">Table Group</Label>
                    <Select
                      value={createForm.watch('group_id')}
                      onValueChange={(value) =>
                        createForm.setValue('group_id', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No group</SelectItem>
                        {tableGroups.map((group) => (
                          <SelectItem
                            key={group.id}
                            value={group.id.toString()}
                          >
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="create-capacity">Capacity</Label>
                      <Input
                        id="create-capacity"
                        type="number"
                        {...createForm.register('capacity')}
                        min={1}
                        max={100}
                        placeholder="e.g., 4"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="create-order">Order</Label>
                      <Input
                        id="create-order"
                        type="number"
                        {...createForm.register('order', { valueAsNumber: true })}
                        min={0}
                      />
                    </div>
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
                      'Create Table'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No tables yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first table to get started
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Grouped tables */}
            {groupedTables.map(
              ({ group, tables: groupTables }) =>
                groupTables.length > 0 && (
                  <div key={group.id}>
                    <h3 className="mb-2 font-medium text-muted-foreground">
                      {group.name}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {groupTables.map((table) => (
                        <TableCard
                          key={table.id}
                          table={table}
                          onEdit={() => openEditDialog(table)}
                          onToggleActive={() => handleToggleActive(table.id)}
                          isPending={isPending}
                        />
                      ))}
                    </div>
                  </div>
                )
            )}

            {/* Ungrouped tables */}
            {ungroupedTables.length > 0 && (
              <div>
                <h3 className="mb-2 font-medium text-muted-foreground">
                  Ungrouped Tables
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ungroupedTables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      onEdit={() => openEditDialog(table)}
                      onToggleActive={() => handleToggleActive(table.id)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={!!editingTable}
          onOpenChange={(open) => !open && setEditingTable(null)}
        >
          <DialogContent>
            <form onSubmit={editForm.handleSubmit(handleEdit)}>
              <DialogHeader>
                <DialogTitle>Edit Table</DialogTitle>
                <DialogDescription>
                  Update table details
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-table_no">
                    Table Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-table_no"
                    {...editForm.register('table_no')}
                    autoFocus
                  />
                  {editForm.formState.errors.table_no && (
                    <p className="text-sm text-destructive">
                      {editForm.formState.errors.table_no.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-group">Table Group</Label>
                  <Select
                    value={editForm.watch('group_id')}
                    onValueChange={(value) =>
                      editForm.setValue('group_id', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No group</SelectItem>
                      {tableGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="edit-capacity">Capacity</Label>
                    <Input
                      id="edit-capacity"
                      type="number"
                      {...editForm.register('capacity')}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="edit-order">Order</Label>
                    <Input
                      id="edit-order"
                      type="number"
                      {...editForm.register('order', { valueAsNumber: true })}
                      min={0}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingTable(null)}
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
      </CardContent>
    </Card>
  )
}

interface TableCardProps {
  table: Table
  onEdit: () => void
  onToggleActive: () => void
  isPending: boolean
}

function TableCard({ table, onEdit, onToggleActive, isPending }: TableCardProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${
        !table.active ? 'bg-muted/50 opacity-70' : ''
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{table.table_no}</span>
          {!table.active && (
            <Badge variant="secondary" className="text-xs">
              Inactive
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {table.capacity ? `Capacity: ${table.capacity}` : 'No capacity set'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={table.active}
          onCheckedChange={onToggleActive}
          disabled={isPending}
          aria-label="Toggle active status"
        />
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </div>
    </div>
  )
}
