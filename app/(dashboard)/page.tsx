import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Users, Rocket } from "lucide-react";
import { OrganizationType } from "@prisma/client";
import { SetupWizard } from "@/components/setup/setup-wizard";

async function getStats() {
  const [restaurants, hospitals, outlets, users] = await Promise.all([
    prisma.restaurants
      .findMany({
        where: {
          organizationType: OrganizationType.RESTAURANT,
        },
      })
      .then((res) => res.length),
    prisma.restaurants
      .findMany({
        where: {
          organizationType: OrganizationType.HOSPITAL,
        },
      })
      .then((res) => res.length),
    prisma.outlet.count(),
    prisma.users.count(),
  ]);

  return { restaurants, hospitals, outlets, users };
}

async function getOrganizationsList() {
  return prisma.restaurants.findMany({
    orderBy: { restaurant_name: "asc" },
    select: { id: true, restaurant_name: true, organizationType: true },
  });
}

export default async function DashboardPage() {
  const [stats, organizations] = await Promise.all([
    getStats(),
    getOrganizationsList(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Action */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Set up a new restaurant and outlet in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetupWizard restaurants={organizations} />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.restaurants}</div>
            <Link
              href="/organizations?type=restaurant"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all restaurants
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hospitals</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hospitals}</div>
            <Link
              href="/organizations?type=hospital"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all Hospitals
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outlets</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outlets}</div>
            <Link
              href="/outlets"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all outlets
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              Total registered users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage Organizations</CardTitle>
            <CardDescription>
              View and edit organization information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/organizations">View Organizations</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage Outlets</CardTitle>
            <CardDescription>
              Configure outlets, tables, and users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/outlets">View Outlets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
