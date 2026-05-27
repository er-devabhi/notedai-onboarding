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
import { Badge } from '@/components/ui/badge'
import { Loader2, KeyRound } from 'lucide-react'
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
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{user.name || 'Unnamed User'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{user.role.replace(/_/g, ' ')}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openResetDialog(user)}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
