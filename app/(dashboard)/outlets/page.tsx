import Link from "next/link";
import { getOutlets } from "@/lib/actions/outlets";
import { getOrganizations } from "@/lib/actions/organizations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Grid3X3, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { OutletsFilter } from "@/components/outlets/outlets-filter";
import { AddOutletButton } from "@/components/outlets/add-outlet-button";

interface OutletsPageProps {
  searchParams: Promise<{ restaurant_id?: string; search?: string }>;
}

export default async function OutletsPage({ searchParams }: OutletsPageProps) {
  const { restaurant_id, search } = await searchParams;
  const restaurantId = restaurant_id ? parseInt(restaurant_id, 10) : undefined;

  const [outlets, restaurants] = await Promise.all([
    getOutlets(restaurantId, search),
    getOrganizations(),
  ]);

  const isFiltered = !!search || !!restaurantId;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outlets</h1>
          <p className="text-muted-foreground">
            {outlets.length} outlet{outlets.length !== 1 ? "s" : ""}{" "}
            {isFiltered ? "found" : "total"}
          </p>
        </div>
        <AddOutletButton
          restaurants={restaurants}
          preselectedRestaurantId={restaurantId}
        />
      </div>

      {/* Filter */}
      <OutletsFilter restaurants={restaurants} />

      {/* Outlet List */}
      {outlets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No outlets found</p>
            <p className="text-muted-foreground">
              {isFiltered
                ? "Try adjusting your search or filter"
                : "Create your first outlet to get started"}
            </p>
            {!isFiltered && (
              <AddOutletButton restaurants={restaurants} className="mt-4" />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {outlets.map((outlet) => {
            const hasSetupComplete =
              outlet._count.table_group >= 1 &&
              outlet._count.tables >= 1 &&
              outlet._count.users >= 1;

            return (
              <Link
                key={outlet.id}
                href={`/outlets/${outlet.id}`}
                className="group"
              >
                <Card className="h-full transition-all hover:border-gray-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="line-clamp-1 group-hover:text-primary">
                          {outlet.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                          {outlet.restaurant?.restaurant_name ||
                            "Unknown Restaurant"}
                        </CardDescription>
                      </div>
                      {hasSetupComplete ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Setup
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {outlet.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{outlet.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Grid3X3 className="h-4 w-4" />
                        <span>{outlet._count.tables} tables</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{outlet._count.users} users</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
