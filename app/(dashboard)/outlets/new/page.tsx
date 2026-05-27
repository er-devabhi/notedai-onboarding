import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrganizations } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { NewOutletForm } from "@/components/outlets/new-outlet-form";

interface NewOutletPageProps {
  searchParams: Promise<{ restaurant_id?: string }>;
}

export default async function NewOutletPage({
  searchParams,
}: NewOutletPageProps) {
  const { restaurant_id } = await searchParams;
  const restaurants = await getOrganizations();

  if (restaurants.length === 0) {
    redirect("/restaurants/new");
  }

  const preselectedRestaurantId = restaurant_id
    ? parseInt(restaurant_id, 10)
    : undefined;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/outlets">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Outlet</h1>
      </div>

      <NewOutletForm
        restaurants={restaurants}
        preselectedRestaurantId={preselectedRestaurantId}
      />
    </div>
  );
}
