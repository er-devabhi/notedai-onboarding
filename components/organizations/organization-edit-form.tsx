"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateOrganization } from "@/lib/actions/organizations";
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
import { Loader2, Save } from "lucide-react";
import { OrganizationType } from "@prisma/client";

interface Organization {
  id: number;
  restaurant_name: string | null;
  organizationType: "RESTAURANT" | "HOSPITAL";
}

interface OrganizationEditFormProps {
  organization: Organization;
}

export const organizationSchema = z.object({
  restaurant_name: z.string().min(1, "Organization name is required"),
  organizationType: z.enum(["RESTAURANT", "HOSPITAL"]),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;

export function OrganizationEditForm({
  organization,
}: OrganizationEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      restaurant_name: organization.restaurant_name || "",
      organizationType:
        OrganizationType.HOSPITAL || OrganizationType.RESTAURANT,
    },
  });

  const handleSubmit = async (data: OrganizationInput) => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateOrganization(organization.id, data);

      if (result.success) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to update restaurant");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>Update organization information</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="restaurant_name">
              Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="restaurant_name"
              {...form.register("restaurant_name")}
              placeholder="Enter organization name"
            />
            {form.formState.errors.restaurant_name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.restaurant_name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="organizationType">Type</Label>
            <Select
              value={form.watch("organizationType")}
              onValueChange={(value) =>
                form.setValue(
                  "organizationType",
                  value as "RESTAURANT" | "HOSPITAL",
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                <SelectItem value="HOSPITAL">Hospital</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
              <p className="text-sm text-green-600">
                Organization updated successfully
              </p>
            </div>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
