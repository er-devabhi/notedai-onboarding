"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/setup": "Setup Wizard",
  "/organizations": "Organizations",
  "/outlets": "Outlets",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  if (pathname === "/organizations/new") {
    return "New Organization";
  }

  if (pathname.startsWith("/organizations/")) {
    return "Organization Details";
  }

  if (pathname === "/outlets/new") {
    return "New Outlet";
  }

  if (pathname.startsWith("/outlets/")) {
    return "Outlet Setup";
  }

  return "Admin";
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="w-full sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 min-h-16 px-6 backdrop-blur-sm">
      <div className="flex gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div>
        <ThemeToggle />
      </div>
    </header>
  );
}
