'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import {
  createQrLogin,
  listQrLogins,
  reinitiateQrLogin,
  revokeQrLogin,
  type QrLogin,
  type QrLoginWithUrl,
} from '@/lib/qr-login-client'
import { UserPicker } from './user-picker'
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
import { Loader2, Plus, Ban, RefreshCw, Copy, Check, Download } from 'lucide-react'
import type { User } from '@/types'

interface QrLoginsTabProps {
  outletId: number
  users: User[]
}

const EXPIRY_OPTIONS = [
  { label: 'Unlimited', value: 'unlimited' },
  { label: '1 hour', value: String(60 * 60) },
  { label: '8 hours', value: String(60 * 60 * 8) },
  { label: '24 hours', value: String(60 * 60 * 24) },
  { label: '7 days', value: String(60 * 60 * 24 * 7) },
  { label: '30 days', value: String(60 * 60 * 24 * 30) },
]

function statusVariant(status: QrLogin['status']) {
  if (status === 'ACTIVE') return 'default' as const
  if (status === 'EXPIRED') return 'secondary' as const
  return 'destructive' as const
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function QrLoginsTab({ outletId, users }: QrLoginsTabProps) {
  const [qrLogins, setQrLogins] = useState<QrLogin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [expiry, setExpiry] = useState('unlimited')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [viewQr, setViewQr] = useState<QrLoginWithUrl | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [reinitiatingId, setReinitiatingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const loadQrLogins = () => {
    setIsLoading(true)
    setLoadError(null)
    listQrLogins(outletId)
      .then(setQrLogins)
      .catch((err) => setLoadError(err.message || 'Failed to load QR logins'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadQrLogins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId])

  const resetForm = () => {
    setSelectedUserId(null)
    setLabel('')
    setExpiry('unlimited')
    setFormError(null)
  }

  const handleCreate = async () => {
    if (!selectedUserId) {
      setFormError('Please select a user')
      return
    }
    if (!label.trim()) {
      setFormError('Please enter a label')
      return
    }

    setFormError(null)
    setIsSubmitting(true)
    try {
      const result = await createQrLogin({
        userId: selectedUserId,
        outletId,
        label: label.trim(),
        expiresInSeconds: expiry === 'unlimited' ? undefined : Number(expiry),
      })
      setIsCreateOpen(false)
      resetForm()
      setViewQr(result)
      loadQrLogins()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create QR login')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevoke = async (id: string) => {
    setActionError(null)
    setRevokingId(id)
    try {
      await revokeQrLogin(id)
      loadQrLogins()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to revoke QR login')
    } finally {
      setRevokingId(null)
    }
  }

  const handleReinitiate = async (id: string) => {
    setActionError(null)
    setReinitiatingId(id)
    try {
      const result = await reinitiateQrLogin(id)
      setViewQr(result)
      loadQrLogins()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reinitiate QR login')
    } finally {
      setReinitiatingId(null)
    }
  }

  const handleDownload = () => {
    const canvas = qrCanvasRef.current
    if (!canvas || !viewQr) return
    const link = document.createElement('a')
    link.download = `qr-${viewQr.label.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleCopyLink = async () => {
    if (!viewQr) return
    await navigator.clipboard.writeText(viewQr.url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>QR Logins</CardTitle>
            <CardDescription>
              Generate a QR code that logs the scanner in as an existing user
            </CardDescription>
          </div>
          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open)
              if (open) resetForm()
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate QR Login</DialogTitle>
                <DialogDescription>
                  Map a QR code to an existing user in this outlet
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label>
                    User <span className="text-destructive">*</span>
                  </Label>
                  <UserPicker
                    users={users}
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="qr-label">
                    Label <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="qr-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Front Desk Kiosk"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="qr-expiry">Expiry</Label>
                  <Select value={expiry} onValueChange={setExpiry}>
                    <SelectTrigger id="qr-expiry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
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
                <Button type="button" onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate QR'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate QR
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {actionError && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{actionError}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadQrLogins}>
              Retry
            </Button>
          </div>
        ) : qrLogins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No QR logins yet</p>
            <p className="text-sm text-muted-foreground">
              Generate a QR code to let a device log in as an existing user
            </p>
          </div>
        ) : (
          <div className="overflow-auto rounded-lg border">
            <table className="w-full min-w-160 border-collapse text-sm">
              <thead className="border-b border-gray-200 bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Label</th>
                  <th className="px-3 py-2 text-left font-medium">Mapped User</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Expires</th>
                  <th className="px-3 py-2 text-left font-medium">Last Used</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {qrLogins.map((qr) => (
                  <tr key={qr.id}>
                    <td className="border-t px-3 py-2 font-medium">{qr.label}</td>
                    <td className="border-t px-3 py-2 text-muted-foreground">
                      {qr.userName || qr.userEmail || qr.userId}
                    </td>
                    <td className="border-t px-3 py-2">
                      <Badge variant={statusVariant(qr.status)}>{qr.status}</Badge>
                    </td>
                    <td className="border-t px-3 py-2 text-muted-foreground">
                      {qr.expiresAt ? formatDate(qr.expiresAt) : 'Unlimited'}
                    </td>
                    <td className="border-t px-3 py-2 text-muted-foreground">
                      {formatDate(qr.lastUsedAt)}
                    </td>
                    <td className="border-t px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Reinitiate (generate new QR)"
                          onClick={() => handleReinitiate(qr.id)}
                          disabled={reinitiatingId === qr.id || qr.status === 'REVOKED'}
                        >
                          {reinitiatingId === qr.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          <span className="sr-only">Reinitiate</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={qr.status === 'REVOKED'}
                            >
                              <Ban className="h-4 w-4" />
                              <span className="sr-only">Revoke</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke QR Login</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will immediately invalidate the QR code for &quot;{qr.label}&quot;.
                                Anyone scanning it afterwards will be rejected. This does not affect
                                the mapped user&apos;s account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRevoke(qr.id)}
                                disabled={revokingId === qr.id}
                              >
                                Revoke
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
      </CardContent>

      {/* View / Download QR Dialog */}
      <Dialog
        open={!!viewQr}
        onOpenChange={(open) => {
          if (!open) setViewQr(null)
          setLinkCopied(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewQr?.label}</DialogTitle>
            <DialogDescription>
              Scanning this QR logs the scanner in as{' '}
              {viewQr?.userName || viewQr?.userEmail}. Save it now — this link
              is only shown once.
            </DialogDescription>
          </DialogHeader>
          {viewQr && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-lg border p-4">
                <QRCodeCanvas ref={qrCanvasRef} value={viewQr.url} size={220} />
              </div>
              <div className="flex w-full items-center gap-2">
                <Input readOnly value={viewQr.url} className="text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={handleCopyLink}>
                  {linkCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {linkCopied ? 'Copied' : 'Copy link'}
                  </span>
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewQr(null)}>
              Close
            </Button>
            <Button type="button" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
