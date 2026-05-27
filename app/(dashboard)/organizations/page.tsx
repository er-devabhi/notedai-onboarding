import Link from "next/link";
import { getOrganizations } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin } from "lucide-react";
import { RestaurantsSearch } from "@/components/organizations/organization-search";

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const organizations = await getOrganizations(type);

  const typeLabel =
    type === "restaurant"
      ? "Restaurant"
      : type === "hospital"
        ? "Hospital"
        : "Organization";

  const typeLabelPlural =
    type === "restaurant"
      ? "Restaurants"
      : type === "hospital"
        ? "Hospitals"
        : "Organizations";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{typeLabelPlural}</h1>
          <p className="text-muted-foreground">
            {organizations.length} {typeLabelPlural.toLowerCase()} total
          </p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">
            <Plus className="mr-2 h-4 w-4" />
            Add {typeLabel}
          </Link>
        </Button>
      </div>

      {/* Search */}
      <RestaurantsSearch />

      {/* Organization List */}
      {organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">
              No {typeLabelPlural.toLowerCase()} yet
            </p>
            <p className="text-muted-foreground">
              Create your first {typeLabel.toLowerCase()} to get started
            </p>
            <Button asChild className="mt-4">
              <Link href="/organizations/new">
                <Plus className="mr-2 h-4 w-4" />
                Add {typeLabel}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1 group-hover:text-primary">
                        {org.restaurant_name || `Unnamed ${typeLabel}`}
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(org.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{org.organizationType}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{org._count.outlets} outlets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{org._count.users} users</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
