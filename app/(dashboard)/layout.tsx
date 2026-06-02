import type { Metadata } from "next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Outlet Admin",
  description: "Internal admin platform for restaurant and outlet setup",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex w-full bg-background">
        <Sidebar />
        <div className="w-full flex flex-col overflow-y-auto">
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
