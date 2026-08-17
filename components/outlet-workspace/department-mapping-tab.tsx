"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  outletDepartmentSchema,
  type OutletDepartmentInput,
  departmentConfigSchema,
  type DepartmentConfigInput,
} from "@/lib/validations";
import {
  createDepartment,
  createDepartmentConfig,
  updateDepartmentConfig,
  deleteDepartmentConfig,
  toggleDepartmentConfigActive,
  updateOutletNotificationSettings,
  bulkMapUserToAllDepartments,
  type BulkMapResult,
} from "@/lib/actions/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Save,
  Building2,
  UserPlus,
  Upload,
  RefreshCw,
  Info,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import type { OutletDepartment, DepartmentConfig, User } from "@/types";
import { BulkUploadDepartmentsDialog } from "./bulk-upload-departments-dialog";
import { BulkUploadDeptMappingDialog } from "./bulk-upload-dept-mapping-dialog";

interface DepartmentMappingTabProps {
  outletId: number;
  departments: OutletDepartment[];
  departmentUsers: User[];
  defaultEmailCc: string[];
  dashboardUrl: string | null;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{7,15}$/;

type DepartmentMappableRole = "DEPARTMENT" | "GRE_HEAD" | "SERVICE_EXCELLENCE";
type RoleFilter = "ALL" | DepartmentMappableRole;

const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "ALL", label: "All Roles" },
  { value: "DEPARTMENT", label: "DEPARTMENT" },
  { value: "GRE_HEAD", label: "GRE HEAD" },
  { value: "SERVICE_EXCELLENCE", label: "SERVICE EXCELLENCE" },
];

// ── Reusable chips input ──────────────────────────────────────────────────────

interface ChipsInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  inputMode?: "text" | "email" | "tel";
  validate?: (value: string) => string | null;
}

function ChipsInput({
  values,
  onChange,
  placeholder,
  inputMode = "text",
  validate,
}: ChipsInputProps) {
  const [draft, setDraft] = useState("");
  const [chipError, setChipError] = useState<string | null>(null);

  const addChip = () => {
    const value = draft.trim();
    if (!value) return;
    if (validate) {
      const err = validate(value);
      if (err) {
        setChipError(err);
        return;
      }
    }
    if (values.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
    setChipError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          inputMode={inputMode}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
            setChipError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addChip();
            }
          }}
          onBlur={addChip}
        />
        <Button type="button" variant="outline" onClick={addChip}>
          Add
        </Button>
      </div>
      {chipError && <p className="text-sm text-destructive">{chipError}</p>}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="rounded-sm hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {v}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline-edit draft for a single contact row
interface RowDraft {
  name: string;
  email: string;
  type: "TO" | "CC";
  whatsapp: string; // comma-separated for compact inline editing
  is_active: boolean;
}

// ── Main component ────────────────────────────────────────────────────────────

export function DepartmentMappingTab({
  outletId,
  departments,
  departmentUsers,
  defaultEmailCc,
  dashboardUrl,
}: DepartmentMappingTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Department dialogs
  const [isDeptCreateOpen, setIsDeptCreateOpen] = useState(false);
  const [isDeptBulkOpen, setIsDeptBulkOpen] = useState(false);
  const [isMappingBulkOpen, setIsMappingBulkOpen] = useState(false);

  // "Map one user to all departments" dialog
  const [isBulkMapOpen, setIsBulkMapOpen] = useState(false);
  const [bulkMapRole, setBulkMapRole] =
    useState<DepartmentMappableRole>("DEPARTMENT");
  const [bulkMapUserId, setBulkMapUserId] = useState<string>("");
  const [bulkMapType, setBulkMapType] = useState<"TO" | "CC">("TO");
  const [bulkMapError, setBulkMapError] = useState<string | null>(null);
  const [bulkMapResult, setBulkMapResult] = useState<BulkMapResult | null>(
    null,
  );

  // Add User dialog (new contact for a department)
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDeptId, setAddDeptId] = useState<string>("");

  // Inline "map existing user" draft (per department, no modal)
  const [mapDraftDeptId, setMapDraftDeptId] = useState<number | null>(null);
  const [mapUserId, setMapUserId] = useState<string>("");
  const [mapType, setMapType] = useState<"TO" | "CC">("TO");
  const [mapWhatsapp, setMapWhatsapp] = useState<string>("");
  const [mapActive, setMapActive] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Inline row editing
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [rowDraft, setRowDraft] = useState<RowDraft | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  // Role filter for the department configuration table
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  // Client-side search: matches department name, or contact name/email
  const [searchQuery, setSearchQuery] = useState("");

  // Notification settings local state
  const [ccEmails, setCcEmails] = useState<string[]>(defaultEmailCc);
  const [dashUrl, setDashUrl] = useState(dashboardUrl || "");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const deptCreateForm = useForm<OutletDepartmentInput>({
    resolver: zodResolver(outletDepartmentSchema),
    defaultValues: { name: "" },
  });
  const addUserForm = useForm<DepartmentConfigInput>({
    resolver: zodResolver(departmentConfigSchema),
    defaultValues: {
      name: "",
      email: "",
      type: "TO",
      whatsapp_number: [],
      is_active: true,
    },
  });

  // ── Notification settings ───────────────────────────────────────────────────
  const handleSaveSettings = () => {
    setError(null);
    setSettingsSaved(false);
    startTransition(async () => {
      const result = await updateOutletNotificationSettings(outletId, {
        default_email_cc: ccEmails,
        dashboard_url: dashUrl,
      });
      if (result.success) {
        setSettingsSaved(true);
        router.refresh();
        setTimeout(() => setSettingsSaved(false), 3000);
      } else {
        setError(result.error || "Failed to save settings");
      }
    });
  };

  // ── Create department ─────────────────────────────────────────────────────────
  const handleCreateDept = (data: OutletDepartmentInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createDepartment(outletId, data);
      if (result.success) {
        setIsDeptCreateOpen(false);
        deptCreateForm.reset({ name: "" });
        router.refresh();
      } else {
        setError(result.error || "Failed to create department");
      }
    });
  };

  // ── Add User (new contact) ──────────────────────────────────────────────────
  const openAddDialog = (departmentId?: number) => {
    setError(null);
    setAddDeptId(departmentId ? departmentId.toString() : "");
    addUserForm.reset({
      name: "",
      email: "",
      type: "TO",
      whatsapp_number: [],
      is_active: true,
    });
    setAddDialogOpen(true);
  };

  const handleAddUser = (data: DepartmentConfigInput) => {
    if (!addDeptId) {
      setError("Please select a department");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createDepartmentConfig(
        parseInt(addDeptId, 10),
        data,
      );
      if (result.success) {
        setAddDialogOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to add user");
      }
    });
  };

  // ── Inline "map existing user" draft ──────────────────────────────────────────
  const startMapDraft = (departmentId: number) => {
    cancelEditRow();
    setMapError(null);
    setMapUserId("");
    setMapType("TO");
    setMapWhatsapp("");
    setMapActive(true);
    setMapDraftDeptId(departmentId);
  };

  const cancelMapDraft = () => {
    setMapDraftDeptId(null);
    setMapError(null);
  };

  const saveMapDraft = (departmentId: number) => {
    if (!mapUserId) {
      setMapError("Please select a user");
      return;
    }
    const user = departmentUsers.find((u) => u.id === mapUserId);
    if (!user) return;
    const numbers = mapWhatsapp
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      name: (user.name || user.email || "").trim(),
      email: (user.email || "").trim(),
      type: mapType,
      whatsapp_number: numbers,
      is_active: mapActive,
    };
    const parsed = departmentConfigSchema.safeParse(payload);
    if (!parsed.success) {
      setMapError(parsed.error.errors[0]?.message || "Invalid user details");
      return;
    }
    setMapError(null);
    startTransition(async () => {
      const result = await createDepartmentConfig(departmentId, parsed.data);
      if (result.success) {
        cancelMapDraft();
        router.refresh();
        toast.success("User mapped to department successfully");
      } else {
        setMapError(result.error || "Failed to map user");
        toast.error(result.error || "Failed to map user");
      }
    });
  };

  // ── Inline row editing ──────────────────────────────────────────────────────
  const startEditRow = (config: DepartmentConfig) => {
    setMapDraftDeptId(null);
    setRowError(null);
    setEditingRowId(config.id);
    setRowDraft({
      name: config.name,
      email: config.email,
      type: config.type,
      whatsapp: config.whatsapp_number.join(", "),
      is_active: config.is_active,
    });
  };

  const cancelEditRow = () => {
    setEditingRowId(null);
    setRowDraft(null);
    setRowError(null);
  };

  const saveEditRow = (configId: number) => {
    if (!rowDraft) return;
    const numbers = rowDraft.whatsapp
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      name: rowDraft.name.trim(),
      email: rowDraft.email.trim(),
      type: rowDraft.type,
      whatsapp_number: numbers,
      is_active: rowDraft.is_active,
    };
    const parsed = departmentConfigSchema.safeParse(payload);
    if (!parsed.success) {
      setRowError(parsed.error.errors[0]?.message || "Invalid details");
      return;
    }
    setRowError(null);
    startTransition(async () => {
      const result = await updateDepartmentConfig(configId, parsed.data);
      if (result.success) {
        cancelEditRow();
        router.refresh();
        toast.success("Contact updated successfully");
      } else {
        setRowError(result.error || "Failed to update");
      }
    });
  };

  const handleDeleteConfig = (id: number) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteDepartmentConfig(id);
      if (result.success) {
        router.refresh();
        toast.success("Contact deleted successfully");
      } else {
        setError(result.error || "Failed to delete contact");
        toast.error(result.error || "Failed to delete contact");
      }
    });
  };

  const handleToggleConfig = (id: number) => {
    startTransition(async () => {
      await toggleDepartmentConfigActive(id);
      router.refresh();
    });
  };

  // ── Map one user to all departments ─────────────────────────────────────────
  const openBulkMapDialog = () => {
    setBulkMapError(null);
    setBulkMapResult(null);
    setBulkMapRole("DEPARTMENT");
    setBulkMapUserId("");
    setBulkMapType("TO");
    setIsBulkMapOpen(true);
  };

  const handleBulkMap = () => {
    if (!bulkMapUserId) {
      setBulkMapError("Please select a user");
      return;
    }
    setBulkMapError(null);
    setBulkMapResult(null);
    startTransition(async () => {
      const result = await bulkMapUserToAllDepartments(
        outletId,
        bulkMapUserId,
        bulkMapType,
      );
      if (result.success) {
        setBulkMapResult(result.data ?? null);
        router.refresh();
        toast.success("User mapped to all departments");
      } else {
        setBulkMapError(result.error || "Failed to map user");
        toast.error(result.error || "Failed to map user");
      }
    });
  };

  // Users selectable for mapping/editing, scoped to the active role filter
  const roleFilteredUsers =
    roleFilter === "ALL"
      ? departmentUsers
      : departmentUsers.filter((u) => u.role === roleFilter);

  // Users available to map into the department being mapped (not already a contact there)
  const mapAvailableUsers = (() => {
    const dept = departments.find((d) => d.id === mapDraftDeptId);
    const existingEmails = new Set(
      dept?.configs.map((c) => c.email.toLowerCase()) ?? [],
    );
    return roleFilteredUsers.filter(
      (u) => u.email && !existingEmails.has(u.email.toLowerCase()),
    );
  })();
  const mapSelectedUser = roleFilteredUsers.find((u) => u.id === mapUserId);

  // For the inline-edit user dropdown: users selectable for the row being
  // edited (excludes emails already used by OTHER rows in that department).
  const editDept = editingRowId
    ? departments.find((d) => d.configs.some((c) => c.id === editingRowId))
    : undefined;
  const editUsedEmails = new Set(
    editDept?.configs
      .filter((c) => c.id !== editingRowId)
      .map((c) => c.email.toLowerCase()) ?? [],
  );
  const editAvailableUsers = roleFilteredUsers.filter(
    (u) => u.email && !editUsedEmails.has(u.email.toLowerCase()),
  );
  const selectedEditUserId =
    roleFilteredUsers.find(
      (u) => u.email?.toLowerCase() === (rowDraft?.email ?? "").toLowerCase(),
    )?.id ?? "";

  const roleFilterLabel =
    ROLE_FILTER_OPTIONS.find((o) => o.value === roleFilter)?.label ?? "";

  // Users selectable in the "map to all departments" dialog, scoped to the
  // role picked there (independent of the table's roleFilter)
  const bulkMapAvailableUsers = departmentUsers.filter(
    (u) => u.role === bulkMapRole && u.email,
  );
  const bulkMapSelectedUser = bulkMapAvailableUsers.find(
    (u) => u.id === bulkMapUserId,
  );

  // Departments with their configs scoped to the active role filter and,
  // when set, the search query (matches department name, or contact name/email)
  const searchQueryNormalized = searchQuery.trim().toLowerCase();
  const visibleDepartments = departments
    .map((dept) => {
      const roleFilteredConfigs =
        roleFilter === "ALL"
          ? dept.configs
          : dept.configs.filter((c) => c.users?.role === roleFilter);

      const deptNameMatches = searchQueryNormalized
        ? dept.name.toLowerCase().includes(searchQueryNormalized)
        : true;

      // A department-name match shows all of its (role-filtered) contacts;
      // otherwise, only contacts whose name/email match the search remain.
      const visibleConfigs =
        !searchQueryNormalized || deptNameMatches
          ? roleFilteredConfigs
          : roleFilteredConfigs.filter(
              (c) =>
                c.name.toLowerCase().includes(searchQueryNormalized) ||
                c.email.toLowerCase().includes(searchQueryNormalized),
            );

      return { ...dept, visibleConfigs, deptNameMatches };
    })
    .filter(
      (dept) =>
        !searchQueryNormalized ||
        dept.deptNameMatches ||
        dept.visibleConfigs.length > 0,
    );

  const totalContacts = visibleDepartments.reduce(
    (sum, d) => sum + d.visibleConfigs.length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Default CC recipients and dashboard URL used for this outlet&apos;s
            notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Default Email CC</Label>
            <ChipsInput
              values={ccEmails}
              onChange={setCcEmails}
              placeholder="Add a CC email and press Enter"
              inputMode="email"
              validate={(v) =>
                emailRegex.test(v) ? null : "Enter a valid email address"
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dashboard-url">Dashboard URL</Label>
            <Input
              id="dashboard-url"
              value={dashUrl}
              onChange={(e) => setDashUrl(e.target.value)}
              placeholder="https://dashboard.example.com/..."
            />
          </div>
          {settingsSaved && (
            <p className="text-sm text-green-600">Settings saved</p>
          )}
          <div>
            <Button onClick={handleSaveSettings} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Department Configuration */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Department Configuration</CardTitle>
              <CardDescription>
                {departments.length} department
                {departments.length !== 1 ? "s" : ""} · {totalContacts} contact
                {totalContacts !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search department, user, or email"
                  className="w-64 pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => startTransition(() => router.refresh())}
                disabled={isPending}
                title="Refresh"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
                />
                <span className="sr-only">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={openBulkMapDialog}
                disabled={isPending}
                title="Map one user to all departments"
              >
                <Info className="h-4 w-4" />
                <span className="sr-only">
                  Map one user to all departments
                </span>
              </Button>
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v as RoleFilter)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_FILTER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setIsMappingBulkOpen(true)}
                disabled={isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Bulk Department Mapping
              </Button>
              <Button
                onClick={() => setIsDeptCreateOpen(true)}
                disabled={isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
              {/* <Button
                onClick={() => openAddDialog()}
                disabled={isPending || departments.length === 0}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button> */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No departments yet</p>
              <p className="text-sm text-muted-foreground">
                Add a department to start configuring users
              </p>
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border">
              <table className="w-full min-w-200 border-collapse text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground border-b border-gray-200">
                  <tr>
                    <th className="sticky left-0 z-20 border-r bg-muted px-3 py-2 text-left font-medium w-56 min-w-55">
                      Department
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-56 min-w-60">
                      User Name
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-56 min-w-55">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-34 min-w-34">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-46 min-w-46">
                      WhatsApp
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Active</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDepartments.map((dept) => {
                    const mappingHere = mapDraftDeptId === dept.id;
                    // dept name spans all its user rows + the trailing map/footer row
                    const deptCell = (
                      <td
                        rowSpan={dept.visibleConfigs.length + 1}
                        className="sticky left-0 z-10 border-t border-r bg-muted px-3 py-2 align-top w-56 min-w-55"
                      >
                        <div className="flex flex-col gap-2">
                          <span className="font-medium">{dept.name}</span>
                          <div className="flex flex-wrap gap-1">
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => openAddDialog(dept.id)}
                              disabled={isPending}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add
                            </Button> */}
                          </div>
                        </div>
                      </td>
                    );

                    return (
                      <Fragment key={dept.id}>
                        {dept.visibleConfigs.map((config, idx) => {
                      const isEditing = editingRowId === config.id;
                      const configRole = config.users?.role;
                      return (
                        <tr
                          key={config.id}
                          className={!config.is_active ? "bg-muted/10" : ""}
                        >
                          {idx === 0 && deptCell}

                          {/* User Name */}
                          <td className="border-t px-3 py-2 align-top">
                            {isEditing ? (
                              <Select
                                value={selectedEditUserId}
                                onValueChange={(val) => {
                                  const u = roleFilteredUsers.find(
                                    (x) => x.id === val,
                                  );
                                  if (u)
                                    setRowDraft((d) =>
                                      d
                                        ? {
                                            ...d,
                                            name: u.name || u.email || "",
                                            email: u.email || "",
                                          }
                                        : d,
                                    );
                                }}
                              >
                                <SelectTrigger className="h-8 min-w-44">
                                  <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                  {editAvailableUsers.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                      {u.name || "Unnamed User"}
                                      {/* {u.email ? ` — ${u.email}` : ""} */}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span>{config.name}</span>
                                {roleFilter === "ALL" && configRole && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {configRole.replace(/_/g, " ")}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Email (auto-assigned from the selected user) */}
                          <td className="border-t px-3 py-2 align-top">
                            <span className="text-muted-foreground">
                              {isEditing
                                ? rowDraft?.email || "—"
                                : config.email}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="border-t px-3 py-2 align-top w-24 min-w-24">
                            {isEditing ? (
                              <Select
                                value={rowDraft?.type}
                                onValueChange={(v) =>
                                  setRowDraft((d) =>
                                    d ? { ...d, type: v as "TO" | "CC" } : d,
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TO">TO</SelectItem>
                                  <SelectItem value="CC">CC</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge
                                variant={
                                  config.type === "TO" ? "default" : "secondary"
                                }
                              >
                                {config.type}
                              </Badge>
                            )}
                          </td>

                          {/* WhatsApp */}
                          <td className="border-t px-3 py-2 align-top w-40 min-w-40">
                            {isEditing ? (
                              <Input
                                value={rowDraft?.whatsapp ?? ""}
                                onChange={(e) =>
                                  setRowDraft((d) =>
                                    d ? { ...d, whatsapp: e.target.value } : d,
                                  )
                                }
                                placeholder="comma-separated"
                                className="h-8 w-40"
                              />
                            ) : config.whatsapp_number.length > 0 ? (
                              <span className="text-muted-foreground">
                                {config.whatsapp_number.join(", ")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Active */}
                          <td className="border-t px-3 py-2 align-top">
                            {isEditing ? (
                              <Switch
                                checked={rowDraft?.is_active ?? false}
                                onCheckedChange={(c) =>
                                  setRowDraft((d) =>
                                    d ? { ...d, is_active: c } : d,
                                  )
                                }
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleConfig(config.id)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1"
                              >
                                {config.is_active ? (
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
                                    onClick={() => saveEditRow(config.id)}
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
                                  onClick={() => startEditRow(config)}
                                  disabled={
                                    isPending ||
                                    editingRowId !== null ||
                                    mapDraftDeptId !== null
                                  }
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
                                        isPending ||
                                        editingRowId !== null ||
                                        mapDraftDeptId !== null
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete User
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Remove &quot;{config.name}&quot; (
                                        {config.email}) from {dept.name}? This
                                        removes the contact and its department
                                        mapping.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteConfig(config.id)
                                        }
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
                          );
                        })}

                        {/* Footer / Map row */}
                        <tr className="bg-muted/5">
                          {dept.visibleConfigs.length === 0 && deptCell}
                          {mappingHere ? (
                            <>
                              {/* User dropdown */}
                              <td className="border-t px-3 py-2 align-top">
                                <Select
                                  value={mapUserId}
                                  onValueChange={setMapUserId}
                                >
                                  <SelectTrigger className="h-8 min-w-44">
                                    <SelectValue placeholder="Select user" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {mapAvailableUsers.length === 0 ? (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        No users available
                                      </div>
                                    ) : (
                                      mapAvailableUsers.map((u) => (
                                        <SelectItem key={u.id} value={u.id}>
                                          {u.name || "Unnamed User"}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </td>
                              {/* Email (auto) */}
                              <td className="border-t px-3 py-2 align-top">
                                <span className="text-muted-foreground">
                                  {mapSelectedUser?.email || "—"}
                                </span>
                              </td>
                              {/* Type */}
                              <td className="border-t px-3 py-2 align-top w-24 min-w-24">
                                <Select
                                  value={mapType}
                                  onValueChange={(v) =>
                                    setMapType(v as "TO" | "CC")
                                  }
                                >
                                  <SelectTrigger className="h-8 w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="TO">TO</SelectItem>
                                    <SelectItem value="CC">CC</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              {/* WhatsApp */}
                              <td className="border-t px-3 py-2 align-top w-40 min-w-40">
                                <Input
                                  value={mapWhatsapp}
                                  onChange={(e) => setMapWhatsapp(e.target.value)}
                                  placeholder="comma-separated"
                                  className="h-8 w-40"
                                />
                              </td>
                              {/* Active */}
                              <td className="border-t px-3 py-2 align-top">
                                <Switch
                                  checked={mapActive}
                                  onCheckedChange={setMapActive}
                                />
                              </td>
                              {/* Actions */}
                              <td className="border-t px-3 py-2 align-top text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => saveMapDraft(dept.id)}
                                      disabled={isPending || !mapUserId}
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
                                      onClick={cancelMapDraft}
                                      disabled={isPending}
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Cancel</span>
                                    </Button>
                                  </div>
                                  {mapError && (
                                    <p className="max-w-48 text-right text-xs text-destructive">
                                      {mapError}
                                    </p>
                                  )}
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td
                                colSpan={5}
                                className="border-t px-3 py-2 text-sm text-muted-foreground"
                              >
                                {dept.visibleConfigs.length === 0 ? (
                                  roleFilter === "ALL" ||
                                  roleFilter === "DEPARTMENT" ? (
                                    <>
                                      No users yet —{" "}
                                      <button
                                        type="button"
                                        className="text-primary underline-offset-2 hover:underline"
                                        onClick={() => openAddDialog(dept.id)}
                                      >
                                        add one
                                      </button>
                                    </>
                                  ) : (
                                    `No ${roleFilterLabel} users mapped yet`
                                  )
                                ) : null}
                              </td>
                              <td className="border-t px-3 py-2 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => startMapDraft(dept.id)}
                                  disabled={isPending || editingRowId !== null}
                                >
                                  <UserPlus className="mr-1 h-3 w-3" />
                                  Map
                                </Button>
                              </td>
                            </>
                          )}
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Department Dialog */}
      <Dialog open={isDeptCreateOpen} onOpenChange={setIsDeptCreateOpen}>
        <DialogContent>
          <form onSubmit={deptCreateForm.handleSubmit(handleCreateDept)}>
            <DialogHeader>
              <DialogTitle>Create Department</DialogTitle>
              <DialogDescription>
                Add a new department to this outlet
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              <Label htmlFor="dept-create-name">
                Department Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dept-create-name"
                {...deptCreateForm.register("name")}
                placeholder="e.g., IP Billing, Ambulance service"
                autoFocus
              />
              {deptCreateForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {deptCreateForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeptCreateOpen(false)}
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
                  "Create Department"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <form onSubmit={addUserForm.handleSubmit(handleAddUser)}>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                Create a new contact for a department. A DEPARTMENT user is
                created and mapped automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-dept">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Select value={addDeptId} onValueChange={setAddDeptId}>
                  <SelectTrigger id="add-dept">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="add-name">
                  User Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-name"
                  {...addUserForm.register("name")}
                  placeholder="e.g., Dr Priyadarshini Pal Singh"
                />
                {addUserForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {addUserForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="add-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  {...addUserForm.register("email")}
                  placeholder="contact@example.com"
                />
                {addUserForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {addUserForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={addUserForm.watch("type")}
                  onValueChange={(v) =>
                    addUserForm.setValue("type", v as "TO" | "CC")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TO">TO (primary recipient)</SelectItem>
                    <SelectItem value="CC">CC (copied)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>WhatsApp Numbers</Label>
                <ChipsInput
                  values={addUserForm.watch("whatsapp_number") || []}
                  onChange={(vals) =>
                    addUserForm.setValue("whatsapp_number", vals, {
                      shouldValidate: true,
                    })
                  }
                  placeholder="e.g., 9810221571"
                  inputMode="tel"
                  validate={(v) =>
                    phoneRegex.test(v)
                      ? null
                      : "Must be 7-15 digits (no spaces or symbols)"
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive users are skipped in notifications
                  </p>
                </div>
                <Switch
                  checked={addUserForm.watch("is_active")}
                  onCheckedChange={(c) => addUserForm.setValue("is_active", c)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
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
                  "Add User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Map One User to All Departments Dialog */}
      <Dialog open={isBulkMapOpen} onOpenChange={setIsBulkMapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map User to All Departments</DialogTitle>
            <DialogDescription>
              Maps the selected user as a contact on every department of
              this outlet in one go, skipping departments where they&apos;re
              already mapped.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select
                value={bulkMapRole}
                onValueChange={(v) => {
                  setBulkMapRole(v as DepartmentMappableRole);
                  setBulkMapUserId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_FILTER_OPTIONS.filter((o) => o.value !== "ALL").map(
                    (o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>User</Label>
              <Select value={bulkMapUserId} onValueChange={setBulkMapUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {bulkMapAvailableUsers.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No {bulkMapRole.replace(/_/g, " ")} users found
                    </div>
                  ) : (
                    bulkMapAvailableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || "Unnamed User"}
                        {u.email ? ` — ${u.email}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Contact Type</Label>
              <Select
                value={bulkMapType}
                onValueChange={(v) => setBulkMapType(v as "TO" | "CC")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO">TO (primary recipient)</SelectItem>
                  <SelectItem value="CC">CC (copied)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkMapSelectedUser && (
              <p className="text-xs text-muted-foreground">
                Will add {bulkMapSelectedUser.name || bulkMapSelectedUser.email}{" "}
                as a {bulkMapType} contact on every department not already
                mapped to {bulkMapSelectedUser.email}.
              </p>
            )}

            {bulkMapError && (
              <p className="text-sm text-destructive">{bulkMapError}</p>
            )}
            {bulkMapResult && (
              <p className="text-sm text-green-600">
                Mapped {bulkMapResult.mapped} department
                {bulkMapResult.mapped !== 1 ? "s" : ""}, skipped{" "}
                {bulkMapResult.skipped} already-mapped (of{" "}
                {bulkMapResult.total} total).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkMapOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleBulkMap}
              disabled={isPending || !bulkMapUserId}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mapping...
                </>
              ) : (
                "Map to All Departments"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Departments Dialog */}
      <BulkUploadDepartmentsDialog
        outletId={outletId}
        open={isDeptBulkOpen}
        onOpenChange={setIsDeptBulkOpen}
      />

      {/* Bulk Upload Department Mapping Dialog */}
      <BulkUploadDeptMappingDialog
        outletId={outletId}
        open={isMappingBulkOpen}
        onOpenChange={setIsMappingBulkOpen}
      />
    </div>
  );
}
