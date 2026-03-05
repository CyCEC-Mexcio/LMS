// components/layouts/user-avatar-dropdown.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";

type Profile = {
  id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
};

// Resolve avatar: prefer profile avatar_url, fall back to Google metadata photo
function resolveAvatar(profile: Profile, googleAvatarUrl?: string): string | null {
  if (profile.avatar_url) return profile.avatar_url;
  if (googleAvatarUrl)    return googleAvatarUrl;
  return null;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function settingsPath(role: string): string {
  if (role === "teacher") return "/teacher/settings";
  if (role === "admin")   return "/admin/settings";
  return "/student/settings";
}

export default function UserAvatarDropdown({
  profile,
  googleAvatarUrl, // pass user.user_metadata.avatar_url from the server component
}: {
  profile: Profile;
  googleAvatarUrl?: string;
}) {
  const [open, setOpen]     = useState(false);
  const [imgError, setImgError] = useState(false);
  const supabase = createClient();
  const router   = useRouter();

  const avatarUrl = resolveAvatar(profile, googleAvatarUrl);
  const initials  = getInitials(profile.full_name);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1 pr-2 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center flex-shrink-0">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={profile.full_name || "Avatar"}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer" // ✅ required for Google CDN avatars
            />
          ) : (
            <span className="text-white text-xs font-bold">{initials}</span>
          )}
        </div>

        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
          {profile.full_name || "Usuario"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile.full_name || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {profile.role === "teacher" ? "Instructor" : profile.role === "admin" ? "Administrador" : "Estudiante"}
              </p>
            </div>

            {/* Links */}
            <div className="py-1">
              <Link
                href={settingsPath(profile.role)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Configuración
              </Link>

              <Link
                href={
                  profile.role === "teacher"
                    ? "/teacher"
                    : profile.role === "admin"
                    ? "/admin"
                    : "/student"
                }
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                Mi Panel
              </Link>
            </div>

            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}