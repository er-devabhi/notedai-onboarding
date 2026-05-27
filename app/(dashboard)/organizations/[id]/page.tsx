import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrganization } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MapPin, Plus, ExternalLink } from "lucide-react";
import { OrganizationEditForm } from "@/components/organizations/organization-edit-form";

interface OrganizationProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationPage({ params }: OrganizationProps) {
  const { id } = await params;
  const organizationId = parseInt(id, 10);

  if (isNaN(organizationId)) {
    notFound();
  }

  const organization = await getOrganization(organizationId);

  if (!organization) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/organizations">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {organization.restaurant_name || "Unnamed Organization"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Organization ID: {organization.id}
          </p>
        </div>
        <Badge variant="secondary">{organization.organizationType}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Edit Form */}
        <OrganizationEditForm organization={organization} />

        {/* Outlets List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Outlets</CardTitle>
                <CardDescription>
                  {organization.outlets.length} outlet
                  {organization.outlets.length !== 1 ? "s" : ""} linked
                </CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/outlets/new?organization_id=${organization.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Outlet
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {organization.outlets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No outlets yet</p>
                <Button size="sm" className="mt-4" asChild>
                  <Link
                    href={`/outlets/new?organization_id=${organization.id}`}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Outlet
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {organization.outlets.map((outlet) => (
                  <Link
                    key={outlet.id}
                    href={`/outlets/${outlet.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{outlet.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {outlet.location || "No location set"}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
