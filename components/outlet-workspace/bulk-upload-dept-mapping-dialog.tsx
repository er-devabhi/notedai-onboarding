"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  bulkUploadDeptMapping,
  type BulkDeptMappingRecord,
  type BulkDeptMappingResultRow,
} from "@/lib/actions/bulk-upload-dept-mapping";
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react";

const REQUIRED_HEADERS = [
  "Department",
  "HOD's Name",
  "Mobile Number",
  "HOD's Email Address",
  "CC mail address",
] as const;

const SAMPLE_CSV = `Department,HOD's Name,Mobile Number,HOD's Email Address,CC mail address
Ambulance service,Dr Priyadarshini Pal Singh,9810221571,priyadarshini_s@hospital.com,"vandana@hospital.com, pooja@hospital.com"
IP Billing,Ms Preeti Goswami,9818580266,preeti_g@hospital.com,pooja_s@hospital.com
Radiology,Dr Ankit Jain,,ankit_j@hospital.com,
`;

interface BulkUploadDeptMappingDialogProps {
  outletId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

interface ParseResult {
  records: BulkDeptMappingRecord[];
  error?: string;
}

function parseCsv(text: string): ParseResult {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { records: [], error: "CSV file is empty" };
  }

  const headerCells = splitCsvLine(lines[0]).map((c) => c.trim());
  if (headerCells.length < REQUIRED_HEADERS.length) {
    return {
      records: [],
      error: `Expected ${REQUIRED_HEADERS.length} columns, got ${headerCells.length}. Headers must be: ${REQUIRED_HEADERS.join(", ")}`,
    };
  }
  for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
    if (headerCells[i] !== REQUIRED_HEADERS[i]) {
      return {
        records: [],
        error: `Invalid header at column ${i + 1}. Expected "${REQUIRED_HEADERS[i]}", got "${headerCells[i]}"`,
      };
    }
  }

  const records: BulkDeptMappingRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]).map((c) => c.trim());
    const department = cells[0] || "";
    const hodName = cells[1] || "";
    const mobile = cells[2] || "";
    const hodEmail = cells[3] || "";
    const ccEmails = cells[4] || "";
    if (!department && !hodName && !hodEmail) continue;
    records.push({
      rowNumber: i + 1,
      department,
      hodName,
      mobile,
      hodEmail,
      ccEmails,
    });
  }

  if (records.length === 0) {
    return { records: [], error: "No data rows found in CSV" };
  }

  debugger;
  console.log("Parsed records:", records);

  return { records };
}

export function BulkUploadDeptMappingDialog({
  outletId,
  open,
  onOpenChange,
}: BulkUploadDeptMappingDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [records, setRecords] = useState<BulkDeptMappingRecord[]>([]);
  const [results, setResults] = useState<BulkDeptMappingResultRow[] | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setParseError(null);
    setRecords([]);
    setResults(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleFile = (f: File) => {
    setFile(f);
    setResults(null);
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setParseError("Only .csv files are supported");
      setRecords([]);
      return;
    }
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      const parsed = parseCsv(text);
      if (parsed.error) {
        setParseError(parsed.error);
        setRecords([]);
      } else {
        setRecords(parsed.records);
        setParseError(null);
      }
    };
    reader.onerror = () => setParseError("Failed to read file");
    reader.readAsText(f);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dept-mapping-bulk-upload-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    if (records.length === 0) return;
    startTransition(async () => {
      const result = await bulkUploadDeptMapping(outletId, records);
      setResults(result.results);
      router.refresh();
    });
  };

  const totalContactsCreated =
    results?.flatMap((r) => r.contacts).filter((c) => c.status === "success")
      .length || 0;
  const totalContactsFailed =
    results?.flatMap((r) => r.contacts).filter((c) => c.status === "failed")
      .length || 0;
  const deptSuccess =
    results?.filter((r) => r.status === "success").length || 0;
  const deptPartial =
    results?.filter((r) => r.status === "partial").length || 0;
  const deptFailed = results?.filter((r) => r.status === "failed").length || 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
        else onOpenChange(o);
      }}
    >
      <DialogContent className="min-w-3xl max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Department Mapping</DialogTitle>
          <DialogDescription>
            Upload a CSV with department contacts. Each row maps a department to
            its HOD (TO) and CC contacts. Departments must already exist. Users
            and subscriptions are created automatically.
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
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                onClick={() => inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40"
                }`}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drag & drop a CSV file, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Headers: Department, HOD&apos;s Name, Mobile Number,
                  HOD&apos;s Email Address, CC mail address
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </div>

              {file && !parseError && records.length > 0 && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB · {records.length} row
                    {records.length !== 1 ? "s" : ""} ready to upload
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
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                  <p className="text-xs text-muted-foreground">
                    Departments OK
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {deptSuccess}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-xs text-muted-foreground">Partial</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {deptPartial}
                  </p>
                </div>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-destructive">
                    {deptFailed}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Contacts: {totalContactsCreated} created, {totalContactsFailed}{" "}
                failed
              </p>

              {/* Results table */}
              <div className="max-h-80 min-w-0 overflow-auto rounded-lg border">
                <table className="w-full min-w-160 border-separate border-spacing-0 text-sm">
                  <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Row</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Department</th>
                      <th className="px-3 py-2 text-left">Contact Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.rowNumber} className="border-t">
                        <td className="border-t px-3 py-2 align-top text-muted-foreground">
                          {r.rowNumber}
                        </td>
                        <td className="border-t px-3 py-2 align-top">
                          {r.status === "success" && (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              OK
                            </span>
                          )}
                          {r.status === "partial" && (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                              Partial
                            </span>
                          )}
                          {r.status === "failed" && (
                            <span className="inline-flex items-center gap-1 text-destructive">
                              <XCircle className="h-4 w-4" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="border-t px-3 py-2 align-top font-medium">
                          {r.department}
                        </td>
                        <td className="border-t px-3 py-2 align-top text-nowrap">
                          {r.error ? (
                            <p className="text-destructive">{r.error}</p>
                          ) : r.contacts.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              {r.contacts.map((c) => (
                                <div
                                  key={`${c.email}-${c.type}`}
                                  className="flex flex-nowrap items-center gap-2 text-xs"
                                >
                                  <Badge
                                    variant={
                                      c.type === "TO" ? "default" : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {c.type}
                                  </Badge>
                                  <span>{c.email}</span>
                                  {c.status === "success" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                  ) : (
                                    <span className="text-destructive">
                                      — {c.error}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
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
                  `Upload ${records.length || ""} row${records.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={reset}>
                Upload Another File
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
