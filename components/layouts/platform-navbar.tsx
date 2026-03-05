// components/layouts/platform-navbar.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import Link from "next/link";
import { Bell } from "lucide-react";
import UserAvatarDropdown from "./user-avatar-dropdown";

export default async function PlatformNavbar() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get auth user for Google avatar URL from metadata
  const { data: { user } } = await supabase.auth.getUser();

  // Get profile for name, role, custom avatar
  const profile = await getUserProfile();

  if (!profile || !user) return null;

  // ✅ Pull Google avatar from Supabase auth metadata
  const googleAvatarUrl: string | undefined =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    undefined;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
      {/* Left — Logo / brand */}
      <Link
        href={
          profile.role === "admin"
            ? "/admin"
            : profile.role === "teacher"
            ? "/teacher"
            : "/student"
        }
        className="flex items-center gap-2"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">L</span>
        </div>
        <span className="font-bold text-gray-900 hidden sm:block">LMS</span>
      </Link>

      {/* Right — notifications + avatar */}
      <div className="flex items-center gap-3">
        {/* Notification bell — placeholder for future feature */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar dropdown — receives Google URL so it can show the photo */}
        <UserAvatarDropdown
          profile={profile}
          googleAvatarUrl={googleAvatarUrl}
        />
      </div>
    </header>
  );
}