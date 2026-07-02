'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUser, updateUser, unassignUserFromOutlet } from '@/lib/actions/users'
import { userRoles } from '@/lib/validations'
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
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil, Eye, EyeOff, Upload } from 'lucide-react'
import { BulkUploadUsersDialog } from './bulk-upload-users-dialog'
import type { User } from '@/types'

interface UsersTabProps {
  outletId: number
  restaurantId: number
  users: User[]
  showDepartmentUsers?: boolean
}

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(userRoles),
})

const editUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(userRoles),
})

type CreateUserInput = z.infer<typeof createUserSchema>
type EditUserInput = z.infer<typeof editUserSchema>

export function UsersTab({
  outletId,
  restaurantId,
  users,
  showDepartmentUsers = true,
}: UsersTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [roleFilter, setRoleFilter] = useState<'team' | 'department'>('team')
  const [isBulkOpen, setIsBulkOpen] = useState(false)

  const departmentCount = users.filter((u) => u.role === 'DEPARTMENT').length
  const teamCount = users.length - departmentCount
  const filteredUsers = users.filter((u) =>
    showDepartmentUsers && roleFilter === 'department'
      ? u.role === 'DEPARTMENT'
      : u.role !== 'DEPARTMENT'
  )

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'MANAGER' },
  })

  const editForm = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
  })

  const handleCreate = async (data: CreateUserInput) => {
    setError(null)
    startTransition(async () => {
      const result = await createUser({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password.trim(),
        role: data.role,
        outlet_id: outletId,
        restaurant_id: restaurantId,
      })

      
      if (result.success) {
        setIsCreateOpen(false)
        createForm.reset()
        router.refresh()
      } else {
        setError(result.error || 'Failed to create user')
      }
    })
  }

  const handleEdit = async (data: EditUserInput) => {
    if (!editingUser) return
    setError(null)

    startTransition(async () => {
      const result = await updateUser(editingUser.id, {
        name: data.name,
        email: data.email,
        role: data.role,
        outlet_id: outletId,
        restaurant_id: restaurantId,
      })

      if (result.success) {
        setEditingUser(null)
        router.refresh()
      } else {
        setError(result.error || 'Failed to update user')
      }
    })
  }

  const handleUnassign = async (userId: string) => {
    startTransition(async () => {
      const result = await unassignUserFromOutlet(userId)
      if (result.success) {
        router.refresh()
      }
    })
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    editForm.reset({
      name: user.name || '',
      email: user.email || '',
      role: user.role,
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage users assigned to this outlet
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
                  email: '',
                  password: '',
                  role: roleFilter === 'department' ? 'DEPARTMENT' : 'MANAGER',
                })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={createForm.handleSubmit(handleCreate)}>
                <DialogHeader>
                  <DialogTitle>Create User</DialogTitle>
                  <DialogDescription>
                    Add a new user to this outlet
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
                      placeholder="Enter full name"
                      autoFocus
                    />
                    {createForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="create-email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="create-email"
                      type="email"
                      {...createForm.register('email')}
                      placeholder="user@example.com"
                    />
                    {createForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="create-password">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="create-password"
                        type={showPassword ? 'text' : 'password'}
                        {...createForm.register('password')}
                        placeholder="Minimum 6 characters"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {createForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="create-role">Role</Label>
                    <Select
                      value={createForm.watch('role')}
                      onValueChange={(value) =>
                        createForm.setValue('role', value as typeof userRoles[number])
                      }
                      disabled={roleFilter === 'department'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {userRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {roleFilter === 'department' && (
                      <p className="text-xs text-muted-foreground">
                        Role is locked to DEPARTMENT on this tab
                      </p>
                    )}
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
                      'Create User'
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
        {/* Role filter */}
        {showDepartmentUsers && (
          <div className="mb-4 inline-flex rounded-lg border p-1">
            <Button
              variant={roleFilter === 'team' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setRoleFilter('team')}
            >
              Team Users ({teamCount})
            </Button>
            <Button
              variant={roleFilter === 'department' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setRoleFilter('department')}
            >
              Department Users ({departmentCount})
            </Button>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {roleFilter === 'department'
                ? 'No department users yet'
                : 'No team users assigned yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              {roleFilter === 'department'
                ? 'Department users are created automatically when you add department contacts'
                : 'Add users to manage this outlet'}
            </p>
          </div>
        ) : (
          <div className="overflow-auto rounded-lg border">
            <table className="w-full min-w-160 border-collapse text-sm">
              <thead className="border-b border-gray-200 bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Role</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="border-t px-3 py-2 font-medium">
                      {user.name || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="border-t px-3 py-2 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="border-t px-3 py-2">
                      <Badge variant="secondary">{user.role.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="border-t px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            {/* <Button variant="ghost" size="icon" disabled={isPending}>
                              <UserMinus className="h-4 w-4" />
                              <span className="sr-only">Unassign</span>
                            </Button> */}
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Unassign User</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {user.name || user.email} from this
                                outlet. The user account will not be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleUnassign(user.id)}>
                                Unassign
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        >
          <DialogContent>
            <form onSubmit={editForm.handleSubmit(handleEdit)}>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user details</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    {...editForm.register('name')}
                    autoFocus
                  />
                  {editForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {editForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    {...editForm.register('email')}
                  />
                  {editForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {editForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editForm.watch('role')}
                    onValueChange={(value) =>
                      editForm.setValue('role', value as typeof userRoles[number])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
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

        {/* Bulk Upload Dialog */}
        <BulkUploadUsersDialog
          outletId={outletId}
          restaurantId={restaurantId}
          open={isBulkOpen}
          onOpenChange={setIsBulkOpen}
        />
      </CardContent>
    </Card>
  )
}
