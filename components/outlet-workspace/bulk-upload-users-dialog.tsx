'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  bulkUploadUsers,
  type BulkUserRecord,
  type BulkUserResultRow,
} from '@/lib/actions/bulk-upload-users'
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'

const REQUIRED_HEADERS = ['Name', 'Email', 'Role', 'Password'] as const

const SAMPLE_CSV = `Name,Email,Role,Password
John Doe,john.doe@example.com,MANAGER,secret123
Jane Roy,jane.roy@example.com,,
Sam Lee,sam.lee@example.com,DEPARTMENT,strongpass1
`

interface BulkUploadUsersDialogProps {
  outletId: number
  restaurantId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += c
    }
  }
  result.push(current)
  return result
}

interface ParseResult {
  records: BulkUserRecord[]
  error?: string
}

function parseCsv(text: string): ParseResult {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = cleaned.split('\n').filter((l) => l.trim().length > 0)

  if (lines.length === 0) {
    return { records: [], error: 'CSV file is empty' }
  }

  // Validate headers (exact match)
  const headerCells = splitCsvLine(lines[0]).map((c) => c.trim())
  if (headerCells.length !== REQUIRED_HEADERS.length) {
    return {
      records: [],
      error: `Expected ${REQUIRED_HEADERS.length} columns, got ${headerCells.length}. Headers must be: ${REQUIRED_HEADERS.join(', ')}`,
    }
  }
  for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
    if (headerCells[i] !== REQUIRED_HEADERS[i]) {
      return {
        records: [],
        error: `Invalid header at column ${i + 1}. Expected "${REQUIRED_HEADERS[i]}", got "${headerCells[i]}"`,
      }
    }
  }

  // Parse data rows. Per-row validity (email format, role, password length,
  // duplicates) is reported by the server in the results table.
  const records: BulkUserRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]).map((c) => c.trim())
    const name = cells[0] || ''
    const email = cells[1] || ''
    const role = cells[2] || ''
    const password = cells[3] || ''
    // skip completely empty rows
    if (!name && !email && !role && !password) continue
    records.push({ rowNumber: i + 1, name, email, role, password })
  }

  if (records.length === 0) {
    return { records: [], error: 'No data rows found in CSV' }
  }

  return { records }
}

export function BulkUploadUsersDialog({
  outletId,
  restaurantId,
  open,
  onOpenChange,
}: BulkUploadUsersDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [records, setRecords] = useState<BulkUserRecord[]>([])
  const [results, setResults] = useState<BulkUserResultRow[] | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setParseError(null)
    setRecords([])
    setResults(null)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const handleFile = (f: File) => {
    setFile(f)
    setResults(null)
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setParseError('Only .csv files are supported')
      setRecords([])
      return
    }
    setParseError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) || ''
      const parsed = parseCsv(text)
      if (parsed.error) {
        setParseError(parsed.error)
        setRecords([])
      } else {
        setRecords(parsed.records)
        setParseError(null)
      }
    }
    reader.onerror = () => setParseError('Failed to read file')
    reader.readAsText(f)
  }

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users-bulk-upload-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = () => {
    if (records.length === 0) return
    startTransition(async () => {
      const result = await bulkUploadUsers(outletId, restaurantId, records)
      setResults(result.results)
      router.refresh()
    })
  }

  const handleDownloadCredentials = () => {
    const succeeded = (results || []).filter((r) => r.status === 'success')
    if (succeeded.length === 0) return
    const escape = (v: string) => {
      const s = v ?? ''
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv =
      'Name,Email,Password\n' +
      succeeded
        .map(
          (r) =>
            `${escape(r.name)},${escape(r.email)},${escape(r.password || '')}`
        )
        .join('\n') +
      '\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users-credentials.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const successCount = results?.filter((r) => r.status === 'success').length || 0
  const failedCount = results?.filter((r) => r.status === 'failed').length || 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose()
        else onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Users</DialogTitle>
          <DialogDescription>
            Upload a CSV with &quot;Name&quot;, &quot;Email&quot;,
            &quot;Role&quot; and &quot;Password&quot; columns. Leave Role blank to
            default to GRE, and Password blank to auto-generate it from the
            email (prefix#1234).
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-4 py-2">
          {!results && (
            <>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Need a template? Download the sample CSV.</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Sample
                </Button>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) handleFile(f)
                }}
                onClick={() => inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                }`}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drag & drop a CSV file, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Headers must be exactly: Name, Email, Role, Password
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                    e.target.value = ''
                  }}
                />
              </div>

              {file && !parseError && records.length > 0 && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB · {records.length} row
                    {records.length !== 1 ? 's' : ''} ready to upload
                  </p>
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">{parseError}</p>
                </div>
              )}
            </>
          )}

          {results && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                  <p className="text-xs text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-600">
                    {successCount}
                  </p>
                </div>
                <div className="flex-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-destructive">
                    {failedCount}
                  </p>
                </div>
              </div>

              {successCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Passwords below are shown once here only (stored hashed in the
                  database). Download the credentials CSV to keep a copy.
                </p>
              )}

              <div className="max-h-64 min-w-0 overflow-auto rounded-lg border">
                <table className="w-full min-w-160 text-sm">
                  <thead className="sticky top-0 bg-muted text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Row</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Password</th>
                      <th className="px-3 py-2 text-left">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.rowNumber} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.rowNumber}
                        </td>
                        <td className="px-3 py-2">
                          {r.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive">
                              <XCircle className="h-4 w-4" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-nowrap">{r.name}</td>
                        <td className="px-3 py-2 text-nowrap">{r.email}</td>
                        <td className="px-3 py-2 text-nowrap">{r.role}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {r.status === 'success' ? r.password : '-'}
                        </td>
                        <td className="px-3 py-2 text-red-600 text-nowrap">
                          {r.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!results ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isPending || records.length === 0 || !!parseError}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${records.length || ''} row${records.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={reset}>
                Upload Another File
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadCredentials}
                disabled={successCount === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Credentials
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
