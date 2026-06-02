"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createOrganization } from "@/lib/actions/organizations";
import { createOutlet } from "@/lib/actions/outlets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Check,
} from "lucide-react";

interface Restaurant {
  id: number;
  restaurant_name: string | null;
  organizationType: "RESTAURANT" | "HOSPITAL";
}

interface SetupWizardProps {
  restaurants: Restaurant[];
}

const STEPS = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "outlet", label: "Outlet Setup", icon: MapPin },
] as const;

const newOrganizationSchema = z.object({
  restaurant_name: z.string().min(1, "Organization name is required"),
  organizationType: z.enum(["RESTAURANT", "HOSPITAL"]),
});

const newOutletSchema = z.object({
  name: z.string().min(1, "Outlet name is required"),
  location: z.string().optional(),
  region: z.string().optional(),
  branchCode: z.string().optional(),
});

type NewOrganizationInput = z.infer<typeof newOrganizationSchema>;
type NewOutletInput = z.infer<typeof newOutletSchema>;

export function SetupWizard({ restaurants }: SetupWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Step 2 state
  const [outlets, setOutlets] = useState<{ id: number; name: string }[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const [showNewOutletForm, setShowNewOutletForm] = useState(false);

  const orgForm = useForm<NewOrganizationInput>({
    resolver: zodResolver(newOrganizationSchema),
    defaultValues: { restaurant_name: "", organizationType: "HOSPITAL" },
  });

  const outletForm = useForm<NewOutletInput>({
    resolver: zodResolver(newOutletSchema),
    defaultValues: { name: "", location: "", region: "", branchCode: "" },
  });

  const resetWizard = () => {
    setCurrentStep(0);
    setSelectedRestaurantId(null);
    setShowNewForm(false);
    setOutlets([]);
    setSelectedOutletId(null);
    setShowNewOutletForm(false);
    setError(null);
    orgForm.reset();
    outletForm.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetWizard();
    setOpen(next);
  };

  // ── Step 1: Organization ──────────────────────────────────────────────────

  const handleOrgSelect = async (value: string) => {
    if (value === "new") {
      setShowNewForm(true);
      setSelectedRestaurantId(null);
      return;
    }
    const id = parseInt(value, 10);
    setSelectedRestaurantId(id);
    setShowNewForm(false);
    setError(null);
    try {
      const res = await fetch(`/api/outlets?restaurant_id=${id}`);
      const data = await res.json();
      setOutlets(data.outlets || []);
    } catch {
      setOutlets([]);
    }
  };

  const handleCreateOrg = (data: NewOrganizationInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createOrganization(data);
      if (result.success && result.data) {
        const newId = (result.data as { id: number }).id;
        setSelectedRestaurantId(newId);
        setShowNewForm(false);
        setOutlets([]);
        orgForm.reset();
      } else {
        setError(result.error || "Failed to create organization");
      }
    });
  };

  const canGoToStep2 = !!selectedRestaurantId && !showNewForm;

  const goNext = () => {
    if (currentStep === 0 && canGoToStep2) {
      setError(null);
      setCurrentStep(1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setError(null);
      setCurrentStep(currentStep - 1);
    }
  };

  // ── Step 2: Outlet ────────────────────────────────────────────────────────

  const handleOutletSelect = (value: string) => {
    if (value === "new") {
      setShowNewOutletForm(true);
      setSelectedOutletId(null);
      return;
    }
    const id = parseInt(value, 10);
    setSelectedOutletId(id);
    setShowNewOutletForm(false);
  };

  const handleCreateOutletSubmit = (data: NewOutletInput) => {
    if (!selectedRestaurantId) return;
    setError(null);
    startTransition(async () => {
      const result = await createOutlet({
        name: data.name,
        restaurant_id: selectedRestaurantId,
        location: data.location || null,
        region: data.region || null,
        branchCode: data.branchCode || null,
        managerNames: [],
        serverNames: [],
        departments: [],
      });
      if (result.success && result.data) {
        const outletId = (result.data as { id: number }).id;
        setOpen(false);
        resetWizard();
        router.push(`/outlets/${outletId}`);
      } else {
        setError(result.error || "Failed to create outlet");
      }
    });
  };

  const handleContinue = () => {
    if (selectedOutletId) {
      setOpen(false);
      resetWizard();
      router.push(`/outlets/${selectedOutletId}`);
    }
  };

  const selectedRestaurant = restaurants.find(
    (r) => r.id === selectedRestaurantId,
  );
  const completedSteps = currentStep;

  return (
    <>
      <Button onClick={() => setOpen(true)}>Start New Setup</Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="min-w-2xl max-w-3xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Setup Wizard</DialogTitle>
          <div className="flex min-h-120">
            {/* ── Left sidebar ─────────────────────────────────── */}
            <div className="flex w-56 shrink-0 flex-col border-r bg-muted/30 p-5">
              <div>
                <h2 className="text-base font-semibold">Setup Wizard</h2>
                {/* Progress bar */}
                <div className="mt-3 mb-5">
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{
                        width: `${(completedSteps / STEPS.length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {completedSteps}/{STEPS.length} completed
                  </p>
                </div>
              </div>

              {/* Step list */}
              <nav className="flex flex-col gap-1">
                {STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStep;
                  const isCurrent = idx === currentStep;
                  const StepIcon = step.icon;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (idx < currentStep) setCurrentStep(idx);
                      }}
                      disabled={idx > currentStep}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        isCurrent
                          ? "bg-primary/10 font-medium text-primary"
                          : isCompleted
                            ? "text-foreground hover:bg-muted"
                            : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : isCurrent
                              ? "border-2 border-primary text-primary"
                              : "border-2 border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <StepIcon className="h-3 w-3" />
                        )}
                      </div>
                      {step.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ── Right content ─────────────────────────────────── */}
            <div className="flex flex-1 flex-col">
              <div className="flex-1 overflow-auto p-6">
                {/* Step 1: Organization */}
                {currentStep === 0 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="text-lg font-semibold">Organization</h3>
                      <p className="text-sm text-muted-foreground">
                        Select an existing organization or create a new one.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Organization</Label>
                      <Select
                        value={
                          showNewForm
                            ? "new"
                            : selectedRestaurantId?.toString() || ""
                        }
                        onValueChange={handleOrgSelect}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an organization..." />
                        </SelectTrigger>
                        <SelectContent>
                          {restaurants.map((r) => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {r.restaurant_name || "Unnamed"}
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            <div className="flex items-center gap-2 text-primary">
                              <Plus className="h-4 w-4" />
                              Create New Organization
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* New org form */}
                    {showNewForm && (
                      <form
                        onSubmit={orgForm.handleSubmit(handleCreateOrg)}
                        className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4"
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="org-name">
                            Organization Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="org-name"
                            {...orgForm.register("restaurant_name")}
                            placeholder="Enter organization name"
                            autoFocus
                          />
                          {orgForm.formState.errors.restaurant_name && (
                            <p className="text-sm text-destructive">
                              {
                                orgForm.formState.errors.restaurant_name
                                  .message
                              }
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Type</Label>
                          <Select
                            value={orgForm.watch("organizationType")}
                            onValueChange={(v) =>
                              orgForm.setValue(
                                "organizationType",
                                v as "RESTAURANT" | "HOSPITAL",
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RESTAURANT">
                                Restaurant
                              </SelectItem>
                              <SelectItem value="HOSPITAL">Hospital</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" disabled={isPending}>
                          {isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Organization"
                          )}
                        </Button>
                      </form>
                    )}

                    {/* Selected confirmation */}
                    {selectedRestaurant && !showNewForm && (
                      <div className="rounded-lg border bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">
                          Selected
                        </p>
                        <p className="font-medium">
                          {selectedRestaurant.restaurant_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedRestaurant.organizationType}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Outlet */}
                {currentStep === 1 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="text-lg font-semibold">Outlet Setup</h3>
                      <p className="text-sm text-muted-foreground">
                        Select an existing outlet or create a new one for{" "}
                        <span className="font-medium text-foreground">
                          {selectedRestaurant?.restaurant_name}
                        </span>
                        .
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Outlet</Label>
                      <Select
                        value={
                          showNewOutletForm
                            ? "new"
                            : selectedOutletId?.toString() || ""
                        }
                        onValueChange={handleOutletSelect}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an outlet..." />
                        </SelectTrigger>
                        <SelectContent>
                          {outlets.map((o) => (
                            <SelectItem key={o.id} value={o.id.toString()}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {o.name}
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            <div className="flex items-center gap-2 text-primary">
                              <Plus className="h-4 w-4" />
                              Create New Outlet
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* New outlet form */}
                    {showNewOutletForm && (
                      <form
                        onSubmit={outletForm.handleSubmit(
                          handleCreateOutletSubmit,
                        )}
                        className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4"
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="outlet-name">
                            Outlet Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="outlet-name"
                            {...outletForm.register("name")}
                            placeholder="Enter outlet name"
                            autoFocus
                          />
                          {outletForm.formState.errors.name && (
                            <p className="text-sm text-destructive">
                              {outletForm.formState.errors.name.message}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label htmlFor="outlet-location">
                            Location{" "}
                            <span className="text-muted-foreground">
                              (optional)
                            </span>
                          </Label>
                          <Input
                            id="outlet-location"
                            {...outletForm.register("location")}
                            placeholder="Enter location"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="outlet-region">Region</Label>
                            <Input
                              id="outlet-region"
                              {...outletForm.register("region")}
                              placeholder="Enter region"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="outlet-code">Branch Code</Label>
                            <Input
                              id="outlet-code"
                              {...outletForm.register("branchCode")}
                              placeholder="Enter code"
                            />
                          </div>
                        </div>

                        <Button type="submit" disabled={isPending}>
                          {isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Outlet & Continue"
                          )}
                        </Button>
                      </form>
                    )}

                    {/* Continue with existing outlet */}
                    {selectedOutletId && !showNewOutletForm && (
                      <Button onClick={handleContinue} className="w-full">
                        Continue to Outlet Setup
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </div>

              {/* ── Bottom navigation ──────────────────────────── */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {currentStep < STEPS.length - 1 && (
                  <Button onClick={goNext} disabled={!canGoToStep2}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
