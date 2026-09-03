"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { navigationItems } from "@/lib/navigation-config";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

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

interface SidebarNavContentProps {
  profile: Profile;
  onItemClick?: () => void;
}

function SidebarNavContent({ profile, onItemClick }: SidebarNavContentProps) {
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

  // Find the single active item that best matches the current pathname
  const activeItem = visibleItems
    .filter((item) => {
      if (pathname === item.href) return true;
      return pathname.startsWith(item.href + "/");
    })
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="p-3 lg:p-4 space-y-1">
      {/* Role Badge */}
      <div className="mb-4 px-3 py-2.5 bg-red-50/80 border border-red-100 rounded-lg">
        <p className="text-xs text-gray-500 font-medium">Rol Actual</p>
        <p className="text-sm font-semibold text-[#C4161C] capitalize">
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
            const isActive = activeItem?.href === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 min-h-[44px] rounded-lg transition-colors",
                  isActive
                    ? "bg-red-50 text-[#C4161C] font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="text-sm truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function PlatformSidebar({ profile }: { profile: Profile }) {
  const { isOpen, close } = useSidebar();

  const dashboardHref =
    profile.role === "admin"
      ? "/admin"
      : profile.role === "teacher"
      ? "/teacher"
      : "/student";

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col md:w-60 lg:w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <SidebarNavContent profile={profile} />
      </aside>

      {/* Mobile Off-canvas Drawer */}
      <div
        id="mobile-sidebar-drawer"
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!isOpen}
      >
        {/* Backdrop Overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={close}
          aria-hidden="true"
        />

        {/* Drawer Content */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navegación principal"
        >
          {/* Drawer Header */}
          <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <Link
              href={dashboardHref}
              onClick={close}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="relative w-7 h-7 flex-shrink-0">
                <Image
                  src="/images/CyCEC Mexico Logo.png"
                  alt="CyCEC México"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-none min-w-0">
                <span className="font-bold text-gray-900 text-sm tracking-wide truncate">
                  CyCEC México
                </span>
                <span className="text-gray-400 text-[9px] tracking-widest uppercase font-medium truncate">
                  Plataforma
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={close}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C4161C]/50"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto">
            <SidebarNavContent profile={profile} onItemClick={close} />
          </div>
        </div>
      </div>
    </>
  );
}