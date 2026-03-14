// components/layouts/platform-navbar.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import UserAvatarDropdown from "./user-avatar-dropdown";
import { AdminNotifications } from "@/components/admin/admin-notifications";

export default async function PlatformNavbar() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getUserProfile();

  if (!profile || !user) return null;

  const googleAvatarUrl: string | undefined =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    undefined;

  const dashboardHref =
    profile.role === "admin"
      ? "/admin"
      : profile.role === "teacher"
      ? "/teacher"
      : "/student";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
      {/* Left — Logo / brand */}
      <Link href={dashboardHref} className="flex items-center gap-3 group">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image
            src="/images/CyCEC Mexico Logo.png"
            alt="CyCEC México"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col leading-none hidden sm:flex">
          <span className="font-bold text-gray-900 text-sm tracking-wide group-hover:text-[#8E0F14] transition-colors">
            CyCEC México
          </span>
          <span className="text-gray-400 text-[10px] tracking-widest uppercase font-medium">
            Plataforma de Aprendizaje
          </span>
        </div>
      </Link>

      {/* Right — notifications + avatar */}
      <div className="flex items-center gap-3">
        {profile.role === "admin" ? (
          <AdminNotifications />
        ) : (
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        )}

        <UserAvatarDropdown
          profile={profile}
          googleAvatarUrl={googleAvatarUrl}
        />
      </div>
    </header>
  );
}