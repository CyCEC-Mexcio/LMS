"use client";

import { Menu, X } from "lucide-react";
import { useSidebar } from "./sidebar-context";

export function MobileNavToggle() {
  const { isOpen, toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      className="md:hidden flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C4161C]/50"
      aria-label={isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
      aria-expanded={isOpen}
      aria-controls="mobile-sidebar-drawer"
    >
      {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
  );
}
