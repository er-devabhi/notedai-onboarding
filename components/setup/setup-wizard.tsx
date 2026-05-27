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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, MapPin, ArrowRight, Loader2, Plus } from "lucide-react";

interface Restaurant {
  id: number;
  restaurant_name: string | null;
  organizationType: "RESTAURANT" | "HOSPITAL";
}

interface SetupWizardProps {
  restaurants: Restaurant[];
}

const newOrganizationSchema = z.object({
  restaurant_name: z.string().min(1, "Organization name is required"),
  organizationType: z.enum(["RESTAURANT", "HOSPITAL"]),
});

const newOutletSchema = z.object({
  name: z.string().min(1, "Outlet name is required"),
  location: z.string().optional(),
});

type NewOrganizationInput = z.infer<typeof newOrganizationSchema>;
type NewOutletInput = z.infer<typeof newOutletSchema>;

export function SetupWizard({ restaurants }: SetupWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Step 1 state
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [showNewRestaurantForm, setShowNewRestaurantForm] = useState(false);

  // Step 2 state
  const [outlets, setOutlets] = useState<{ id: number; name: string }[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const [showNewOutletForm, setShowNewOutletForm] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Step 1 form
  const restaurantForm = useForm<NewOrganizationInput>({
    resolver: zodResolver(newOrganizationSchema),
    defaultValues: {
      restaurant_name: "",
      organizationType: "RESTAURANT",
    },
  });

  // Step 2 form
  const outletForm = useForm<NewOutletInput>({
    resolver: zodResolver(newOutletSchema),
    defaultValues: {
      name: "",
      location: "",
    },
  });

  // Handle restaurant selection
  const handleRestaurantSelect = async (value: string) => {
    if (value === "new") {
      setShowNewRestaurantForm(true);
      setSelectedRestaurantId(null);
      return;
    }

    const id = parseInt(value, 10);
    setSelectedRestaurantId(id);
    setShowNewRestaurantForm(false);
    setError(null);

    // Fetch outlets for this restaurant
    try {
      const response = await fetch(`/api/outlets?restaurant_id=${id}`);
      const data = await response.json();
      setOutlets(data.outlets || []);
    } catch {
      console.error("[v0] Error fetching outlets");
      setOutlets([]);
    }
  };

  // Create new restaurant
  const handleCreateRestaurant = async (data: NewOrganizationInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createOrganization(data);
      if (result.success && result.data) {
        setSelectedRestaurantId((result.data as { id: number }).id);
        setShowNewRestaurantForm(false);
        setOutlets([]);
        restaurantForm.reset();
      } else {
        setError(result.error || "Failed to create restaurant");
      }
    });
  };

  // Handle outlet selection
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

  // Create new outlet
  const handleCreateOutlet = async (data: NewOutletInput) => {
    if (!selectedRestaurantId) return;

    setError(null);
    startTransition(async () => {
      const result = await createOutlet({
        ...data,
        restaurant_id: selectedRestaurantId,
        location: data.location || null,
        region: null,
        branchCode: null,
        managerNames: [],
        serverNames: [],
        departments: [],
      });

      if (result.success && result.data) {
        const outletId = (result.data as { id: number }).id;
        router.push(`/outlets/${outletId}`);
      } else {
        setError(result.error || "Failed to create outlet");
      }
    });
  };

  // Continue to outlet setup
  const handleContinue = () => {
    if (selectedOutletId) {
      router.push(`/outlets/${selectedOutletId}`);
    }
  };

  const selectedRestaurant = restaurants.find(
    (r) => r.id === selectedRestaurantId,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1: Restaurant Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              1
            </div>
            <div>
              <CardTitle className="text-lg">Select Restaurant</CardTitle>
              <CardDescription>
                Choose an existing restaurant or create a new one
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="restaurant">Restaurant</Label>
            <Select
              value={
                showNewRestaurantForm
                  ? "new"
                  : selectedRestaurantId?.toString() || ""
              }
              onValueChange={handleRestaurantSelect}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a restaurant..." />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem
                    key={restaurant.id}
                    value={restaurant.id.toString()}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {restaurant.restaurant_name || "Unnamed Restaurant"}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="new">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="h-4 w-4" />
                    Create New Restaurant
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* New Restaurant Form */}
          {showNewRestaurantForm && (
            <form
              onSubmit={restaurantForm.handleSubmit(handleCreateRestaurant)}
              className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization_name">Organization Name</Label>
                <Input
                  id="restaurant_name"
                  {...restaurantForm.register("restaurant_name")}
                  placeholder="Enter restaurant name"
                  autoFocus
                />
                {restaurantForm.formState.errors.restaurant_name && (
                  <p className="text-sm text-destructive">
                    {restaurantForm.formState.errors.restaurant_name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="organizationType">Type</Label>
                <Select
                  value={restaurantForm.watch("organizationType")}
                  onValueChange={(value) =>
                    restaurantForm.setValue(
                      "organizationType",
                      value as "RESTAURANT" | "HOSPITAL",
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESTAURANT">Restaurant</SelectItem>
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

          {selectedRestaurant && !showNewRestaurantForm && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">Selected:</p>
              <p className="font-medium">
                {selectedRestaurant.restaurant_name} (
                {selectedRestaurant.organizationType})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Outlet Selection */}
      {selectedRestaurantId && !showNewRestaurantForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                2
              </div>
              <div>
                <CardTitle className="text-lg">Select Outlet</CardTitle>
                <CardDescription>
                  Choose an existing outlet or create a new one
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="outlet">Outlet</Label>
              <Select
                value={
                  showNewOutletForm ? "new" : selectedOutletId?.toString() || ""
                }
                onValueChange={handleOutletSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an outlet..." />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id.toString()}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {outlet.name}
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

            {/* New Outlet Form */}
            {showNewOutletForm && (
              <form
                onSubmit={outletForm.handleSubmit(handleCreateOutlet)}
                className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Outlet Name</Label>
                  <Input
                    id="name"
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
                  <Label htmlFor="location">
                    Location{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="location"
                    {...outletForm.register("location")}
                    placeholder="Enter location"
                  />
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Outlet & Continue Setup"
                  )}
                </Button>
              </form>
            )}

            {/* Continue Button */}
            {selectedOutletId && !showNewOutletForm && (
              <Button onClick={handleContinue} className="w-full">
                Continue to Outlet Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
