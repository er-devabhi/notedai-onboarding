"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrganization } from "@/lib/actions/organizations";
import {
  organizationSchema,
  type OrganizationInput,
} from "@/lib/validations";
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
import { ChevronLeft, Loader2 } from "lucide-react";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      restaurant_name: "",
      organizationType: "RESTAURANT",
    },
  });

  const handleSubmit = async (data: OrganizationInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createOrganization(data);

      if (result.success && result.data) {
        router.push(`/organizations/${(result.data as { id: number }).id}`);
      } else {
        setError(result.error || "Failed to create organization");
      }
    });
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/organizations">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Organization</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Enter the details for the new organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="organization_name">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="organization_name"
                {...form.register("restaurant_name")}
                placeholder="Enter organization name"
                autoFocus
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

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
