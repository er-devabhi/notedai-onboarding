'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetUserPassword } from '@/lib/actions/users'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, KeyRound, Search } from 'lucide-react'
import type { User } from '@/types'

interface PasswordTabProps {
  users: User[]
}

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

type PasswordInput = z.infer<typeof passwordSchema>

export function PasswordTab({ users }: PasswordTabProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const availableRoles = Array.from(new Set(users.map((u) => u.role))).sort()

  const searchQuery = search.trim().toLowerCase()
  const filteredUsers = users
    .filter((u) => roleFilter === 'ALL' || u.role === roleFilter)
    .filter((u) =>
      searchQuery
        ? (u.name || '').toLowerCase().includes(searchQuery) ||
          (u.email || '').toLowerCase().includes(searchQuery)
        : true
    )

  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const handleResetPassword = async (data: PasswordInput) => {
    if (!selectedUser) return
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await resetUserPassword(
        selectedUser.id,
        data.password,
        data.confirmPassword
      )

      if (result.success) {
        setSuccess(`Password reset successfully for ${selectedUser.name || selectedUser.email}`)
        setSelectedUser(null)
        form.reset()
      } else {
        setError(result.error || 'Failed to reset password')
      }
    })
  }

  const openResetDialog = (user: User) => {
    setSelectedUser(user)
    setError(null)
    form.reset()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Management</CardTitle>
        <CardDescription>
          Reset passwords for users assigned to this outlet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 p-3">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No users assigned yet</p>
            <p className="text-sm text-muted-foreground">
              Add users in the Users tab first
            </p>
          </div>
        ) : (
          <>
            {/* Role filter + search */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles ({users.length})</SelectItem>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace(/_/g, ' ')} (
                      {users.filter((u) => u.role === role).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="pl-8"
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No users match your filters</p>
                <p className="text-sm text-muted-foreground">
                  Try a different role or search term
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
                          {user.name || 'Unnamed User'}
                        </td>
                        <td className="border-t px-3 py-2 text-muted-foreground">
                          {user.email || '—'}
                        </td>
                        <td className="border-t px-3 py-2">
                          <Badge variant="secondary">
                            {user.role.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="border-t px-3 py-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResetDialog(user)}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Reset Password
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Reset Password Dialog */}
        <Dialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        >
          <DialogContent>
            <form onSubmit={form.handleSubmit(handleResetPassword)}>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Set a new password for{' '}
                  <span className="font-medium">
                    {selectedUser?.name || selectedUser?.email}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">
                    New Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register('password')}
                    placeholder="Minimum 6 characters"
                    autoFocus
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...form.register('confirmPassword')}
                    placeholder="Re-enter password"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
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
