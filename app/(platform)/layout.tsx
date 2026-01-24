import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import PlatformNavbar from "@/components/layouts/platform-navbar";
import PlatformSidebar from "@/components/layouts/platform-sidebar";

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
    <div className="h-screen flex flex-col">
      {/* Top Navbar */}
      <PlatformNavbar profile={profile} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <PlatformSidebar profile={profile} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}