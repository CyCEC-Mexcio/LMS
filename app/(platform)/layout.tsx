import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import PlatformNavbar from "@/components/layouts/platform-navbar";
import PlatformSidebar from "@/components/layouts/platform-sidebar";
import { SidebarProvider } from "@/components/layouts/sidebar-context";
import { SessionGuard } from "@/components/session-guard";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <SessionGuard>
      <SidebarProvider>
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
          {/* Top Navbar */}
          <PlatformNavbar />

          <div className="flex flex-1 overflow-hidden min-w-0 relative">
            {/* Sidebar (Desktop/Tablet in-flow + Mobile off-canvas drawer) */}
            <PlatformSidebar profile={profile} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-4 sm:p-6 lg:p-8 min-w-0 w-full">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SessionGuard>
  );
}