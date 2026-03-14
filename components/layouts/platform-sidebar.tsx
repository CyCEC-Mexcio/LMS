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

type SectionKey = "shared" | "student" | "teacher" | "admin";

function getSection(item: (typeof navigationItems)[0]): SectionKey {
  if (item.href.startsWith("/admin")) return "admin";
  if (item.href.startsWith("/teacher")) return "teacher";
  if (item.href.startsWith("/student")) return "student";
  return "shared";
}

const sectionLabels: Record<SectionKey, string> = {
  shared: "",
  student: "Estudiante",
  teacher: "Instructor",
  admin: "Administración",
};

export default function PlatformSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();

  // Filter nav items visible to this role
  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(profile.role as any)
  );

  // Group by section, preserving order
  const grouped: { section: SectionKey; items: typeof visibleItems }[] = [];
  const sectionOrder: SectionKey[] = ["shared", "student", "teacher", "admin"];

  for (const key of sectionOrder) {
    const items = visibleItems.filter((item) => getSection(item) === key);
    if (items.length > 0) {
      grouped.push({ section: key, items });
    }
  }

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

        {/* Navigation Items grouped by section */}
        {grouped.map(({ section, items }, idx) => (
          <div key={section}>
            {/* Section header (skip for 'shared' / first section) */}
            {section !== "shared" && (
              <div className="pt-3 pb-1">
                {idx > 0 && <div className="border-t border-gray-200 mb-2" />}
                <p className="px-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  {sectionLabels[section]}
                </p>
              </div>
            )}

            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/browse" && pathname.startsWith(item.href + "/"));

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
        ))}
      </div>
    </aside>
  );
}