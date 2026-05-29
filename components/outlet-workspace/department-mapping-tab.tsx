"use client";

import { useState, useTransition } from "react";
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
  updateDepartment,
  deleteDepartment,
  createDepartmentConfig,
  updateDepartmentConfig,
  deleteDepartmentConfig,
  toggleDepartmentConfigActive,
  updateOutletNotificationSettings,
  subscribeUserToDepartment,
  unsubscribeUserFromDepartment,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Mail,
  Phone,
  X,
  Save,
  Building2,
  UserPlus,
  UserMinus,
  Upload,
} from "lucide-react";
import type { OutletDepartment, DepartmentConfig, User } from "@/types";
import { BulkUploadDepartmentsDialog } from "./bulk-upload-departments-dialog";

interface DepartmentMappingTabProps {
  outletId: number;
  departments: OutletDepartment[];
  departmentUsers: User[];
  defaultEmailCc: string[];
  dashboardUrl: string | null;
}

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{7,15}$/;

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
  const [editingDept, setEditingDept] = useState<OutletDepartment | null>(null);

  // Config dialog
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    departmentId: number;
    config: DepartmentConfig | null;
  }>({ open: false, mode: "create", departmentId: 0, config: null });

  // Map-user dialog
  const [mapDialog, setMapDialog] = useState<{
    open: boolean;
    departmentId: number;
  }>({ open: false, departmentId: 0 });
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Notification settings local state
  const [ccEmails, setCcEmails] = useState<string[]>(defaultEmailCc);
  const [dashUrl, setDashUrl] = useState(dashboardUrl || "");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const deptCreateForm = useForm<OutletDepartmentInput>({
    resolver: zodResolver(outletDepartmentSchema),
    defaultValues: { name: "" },
  });
  const deptEditForm = useForm<OutletDepartmentInput>({
    resolver: zodResolver(outletDepartmentSchema),
  });
  const configForm = useForm<DepartmentConfigInput>({
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

  // ── Department handlers ───────────────────────────────────────────────────────
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

  const handleEditDept = (data: OutletDepartmentInput) => {
    if (!editingDept) return;
    setError(null);
    startTransition(async () => {
      const result = await updateDepartment(editingDept.id, data);
      if (result.success) {
        setEditingDept(null);
        router.refresh();
      } else {
        setError(result.error || "Failed to update department");
      }
    });
  };

  const handleDeleteDept = (id: number) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteDepartment(id);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to delete department");
      }
    });
  };

  const openEditDept = (dept: OutletDepartment) => {
    setEditingDept(dept);
    deptEditForm.reset({ name: dept.name });
  };

  // ── Config handlers ───────────────────────────────────────────────────────────
  const openCreateConfig = (departmentId: number) => {
    configForm.reset({
      name: "",
      email: "",
      type: "TO",
      whatsapp_number: [],
      is_active: true,
    });
    setConfigDialog({ open: true, mode: "create", departmentId, config: null });
  };

  const openEditConfig = (departmentId: number, config: DepartmentConfig) => {
    configForm.reset({
      name: config.name,
      email: config.email,
      type: config.type,
      whatsapp_number: config.whatsapp_number,
      is_active: config.is_active,
    });
    setConfigDialog({ open: true, mode: "edit", departmentId, config });
  };

  const handleSubmitConfig = (data: DepartmentConfigInput) => {
    setError(null);
    startTransition(async () => {
      const result =
        configDialog.mode === "create"
          ? await createDepartmentConfig(configDialog.departmentId, data)
          : await updateDepartmentConfig(configDialog.config!.id, data);

      if (result.success) {
        setConfigDialog((s) => ({ ...s, open: false }));
        router.refresh();
      } else {
        setError(result.error || "Failed to save contact");
      }
    });
  };

  const handleDeleteConfig = (id: number) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteDepartmentConfig(id);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to delete contact");
      }
    });
  };

  const handleToggleConfig = (id: number) => {
    startTransition(async () => {
      await toggleDepartmentConfigActive(id);
      router.refresh();
    });
  };

  // ── Subscription handlers ───────────────────────────────────────────────────
  const openMapDialog = (departmentId: number) => {
    setSelectedUserId("");
    setError(null);
    setMapDialog({ open: true, departmentId });
  };

  const handleSubscribe = () => {
    if (!selectedUserId) return;
    setError(null);
    startTransition(async () => {
      const result = await subscribeUserToDepartment(
        selectedUserId,
        mapDialog.departmentId,
      );
      if (result.success) {
        setMapDialog((s) => ({ ...s, open: false }));
        setSelectedUserId("");
        router.refresh();
      } else {
        setError(result.error || "Failed to map user");
      }
    });
  };

  const handleUnsubscribe = (userId: string, departmentId: number) => {
    setError(null);
    startTransition(async () => {
      const result = await unsubscribeUserFromDepartment(userId, departmentId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to remove user");
      }
    });
  };

  const whatsappNumbers = configForm.watch("whatsapp_number") || [];

  // DEPARTMENT users not yet subscribed to the dialog's target department
  const availableUsers = (() => {
    const dept = departments.find((d) => d.id === mapDialog.departmentId);
    const subscribedIds = new Set(
      dept?.user_subscriptions.map((s) => s.user_id) ?? [],
    );
    return departmentUsers.filter((u) => !subscribedIds.has(u.id));
  })();

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

      {/* Departments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                Create departments and configure their TO / CC contacts
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeptBulkOpen(true)}
                disabled={isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
              <Button onClick={() => setIsDeptCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No departments yet</p>
              <p className="text-sm text-muted-foreground">
                Add a department to start configuring contacts
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="flex flex-col gap-2">
              {departments.map((dept) => (
                <AccordionItem
                  key={dept.id}
                  value={dept.id.toString()}
                  className="rounded-lg border px-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dept.name}</span>
                        <Badge variant="secondary">
                          {dept.configs.length} contact
                          {dept.configs.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDept(dept)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit department</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete department</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Department
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Delete &quot;{dept.name}&quot; and all{" "}
                              {dept.configs.length} of its contacts? This cannot
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteDept(dept.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <AccordionContent>
                    <div className="flex flex-col gap-2 pb-2">
                      {dept.configs.length === 0 ? (
                        <p className="py-2 text-sm text-muted-foreground">
                          No contacts configured yet
                        </p>
                      ) : (
                        dept.configs.map((config) => (
                          <div
                            key={config.id}
                            className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                              !config.is_active ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {config.name}
                                </span>
                                <Badge
                                  variant={
                                    config.type === "TO"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {config.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                {config.email}
                              </div>
                              {config.whatsapp_number.length > 0 && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5" />
                                  {config.whatsapp_number.join(", ")}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={config.is_active}
                                onCheckedChange={() =>
                                  handleToggleConfig(config.id)
                                }
                                disabled={isPending}
                                aria-label="Toggle active"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditConfig(dept.id, config)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit contact</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">
                                      Delete contact
                                    </span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Contact
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Remove &quot;{config.name}&quot; (
                                      {config.email}) from this department?
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
                          </div>
                        ))
                      )}
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCreateConfig(dept.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Contact
                        </Button>
                      </div>

                      {/* Mapped DEPARTMENT users */}
                      <div className="mt-2 flex flex-col gap-2 border-t pt-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Mapped Users
                            <span className="ml-1 text-muted-foreground">
                              ({dept.user_subscriptions.length})
                            </span>
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMapDialog(dept.id)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Map User
                          </Button>
                        </div>
                        {dept.user_subscriptions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No users mapped to this department yet
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {dept.user_subscriptions.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between rounded-lg border p-2.5"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {sub.user.name || "Unnamed User"}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {sub.user.email}
                                  </p>
                                </div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={isPending}
                                    >
                                      <UserMinus className="h-4 w-4" />
                                      <span className="sr-only">
                                        Remove from department
                                      </span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Remove Mapped User
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Remove{" "}
                                        {sub.user.name ||
                                          sub.user.email ||
                                          "this user"}{" "}
                                        from &quot;{dept.name}&quot;? This only
                                        removes the department mapping; the user
                                        account is kept.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleUnsubscribe(
                                            sub.user_id,
                                            dept.id,
                                          )
                                        }
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
            <div className="flex flex-col gap-2 py-2">
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
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-2">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}
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

      {/* Edit Department Dialog */}
      <Dialog
        open={!!editingDept}
        onOpenChange={(open) => !open && setEditingDept(null)}
      >
        <DialogContent>
          <form onSubmit={deptEditForm.handleSubmit(handleEditDept)}>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>Rename this department</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              <Label htmlFor="dept-edit-name">
                Department Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dept-edit-name"
                {...deptEditForm.register("name")}
                autoFocus
              />
              {deptEditForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {deptEditForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingDept(null)}
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
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Config (contact) Dialog */}
      <Dialog
        open={configDialog.open}
        onOpenChange={(open) => setConfigDialog((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <form onSubmit={configForm.handleSubmit(handleSubmitConfig)}>
            <DialogHeader>
              <DialogTitle>
                {configDialog.mode === "create"
                  ? "Add Contact"
                  : "Edit Contact"}
              </DialogTitle>
              <DialogDescription>
                Configure a TO or CC contact for this department
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="config-name">
                  Contact Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="config-name"
                  {...configForm.register("name")}
                  placeholder="e.g., Dr Priyadarshini Pal Singh"
                  autoFocus
                />
                {configForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {configForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="config-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="config-email"
                  type="email"
                  {...configForm.register("email")}
                  placeholder="contact@example.com"
                />
                {configForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {configForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="config-type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={configForm.watch("type")}
                  onValueChange={(value) =>
                    configForm.setValue("type", value as "TO" | "CC")
                  }
                >
                  <SelectTrigger id="config-type">
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
                  values={whatsappNumbers}
                  onChange={(vals) =>
                    configForm.setValue("whatsapp_number", vals, {
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
                {configForm.formState.errors.whatsapp_number && (
                  <p className="text-sm text-destructive">
                    {configForm.formState.errors.whatsapp_number.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive contacts are skipped in notifications
                  </p>
                </div>
                <Switch
                  checked={configForm.watch("is_active")}
                  onCheckedChange={(checked) =>
                    configForm.setValue("is_active", checked)
                  }
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfigDialog((s) => ({ ...s, open: false }))}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : configDialog.mode === "create" ? (
                  "Add Contact"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Map User Dialog */}
      <Dialog
        open={mapDialog.open}
        onOpenChange={(open) => setMapDialog((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map User to Department</DialogTitle>
            <DialogDescription>
              Subscribe an existing DEPARTMENT-role user to this department
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <Label htmlFor="map-user">User</Label>
            {availableUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No more department users available to map. Add a contact or
                create a DEPARTMENT user from the Users tab first.
              </p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="map-user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || "Unnamed User"}
                      {u.email ? ` — ${u.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMapDialog((s) => ({ ...s, open: false }))}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={isPending || !selectedUserId}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mapping...
                </>
              ) : (
                "Map User"
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
    </div>
  );
}
