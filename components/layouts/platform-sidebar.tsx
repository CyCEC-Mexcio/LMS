"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation-config";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
};

export default function PlatformSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();

  // Filter nav items based on user role
  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(profile.role as any)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-1">
        {/* Role Badge */}
        <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">Rol Actual</p>
          <p className="text-sm font-semibold text-blue-600 capitalize">
            {profile.role === "student" && "Estudiante"}
            {profile.role === "teacher" && "Instructor"}
            {profile.role === "admin" && "Administrador"}
          </p>
        </div>

        {/* Navigation Items */}
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Divider for role sections */}
      {profile.role === "teacher" && (
        <div className="px-4 py-2">
          <div className="border-t border-gray-200 my-2"></div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Instructor
          </p>
        </div>
      )}

      {profile.role === "admin" && (
        <div className="px-4 py-2">
          <div className="border-t border-gray-200 my-2"></div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Administración
          </p>
        </div>
      )}
    </aside>
  );
}