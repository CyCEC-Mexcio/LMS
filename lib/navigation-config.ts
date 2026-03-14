// lib/navigation-config.ts
// Add settings entries for student and teacher so the sidebar links work.
// ⚠️  This is a MERGE — only add the missing entries if you already have
//     navigation items defined here. Do not delete your existing items.

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  roles: ("student" | "teacher" | "admin")[];
};

export const navigationItems: NavItem[] = [
  // ── Shared ────────────────────────────────────────────────────────────────
  {
    title: "Explorar Cursos",
    href: "/browse",
    icon: "🔍",
    roles: ["student", "teacher", "admin"],
  },

  // ── Student ───────────────────────────────────────────────────────────────
  {
    title: "Mi Aprendizaje",
    href: "/student/courses",
    icon: "📚",
    roles: ["student"],
  },
  {
    title: "Mi Progreso",
    href: "/student/progress",
    icon: "📊",
    roles: ["student"],
  },
  {
    title: "Mis Certificados",
    href: "/student/certificates",
    icon: "🏆",
    roles: ["student"],
  },
  {
    title: "Configuración",         
    href: "/student/settings",
    icon: "⚙️",
    roles: ["student"],
  },

  // ── Teacher ───────────────────────────────────────────────────────────────
  {
    title: "Mi Panel",
    href: "/teacher",
    icon: "🏠",
    roles: ["teacher"],
  },
  {
    title: "Mis Cursos",
    href: "/teacher/courses",
    icon: "📖",
    roles: ["teacher"],
  },
  {
    title: "Crear Curso",
    href: "/teacher/courses/new",
    icon: "➕",
    roles: ["teacher"],
  },
  {
    title: "Analíticas",
    href: "/teacher/analytics",
    icon: "📈",
    roles: ["teacher"],
  },
  {
    title: "Ganancias",
    href: "/teacher/earnings",
    icon: "💰",
    roles: ["teacher"],
  },
  {
    title: "Configuración",           
    href: "/teacher/settings",
    icon: "⚙️",
    roles: ["teacher"],
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    title: "Panel Admin",
    href: "/admin",
    icon: "🛡️",
    roles: ["admin"],
  },
  {
    title: "Crear Curso",
    href: "/admin/courses/new",
    icon: "➕",
    roles: ["admin"],
  },
  {
    title: "Gestionar Cursos",
    href: "/admin/courses",
    icon: "📚",
    roles: ["admin"],
  },
  {
    title: "Cursos Pendientes",
    href: "/admin/courses/pending",
    icon: "⏳",
    roles: ["admin"],
  },
  {
    title: "Usuarios",
    href: "/admin/users",
    icon: "👥",
    roles: ["admin"],
  },
  {
    title: "Crear Instructor",
    href: "/admin/create-instructor",
    icon: "👨‍🏫",
    roles: ["admin"],
  },
  {
    title: "Pagos",
    href: "/admin/payouts",            
    icon: "💳",
    roles: ["admin"],
  },
  {
  title: "Configuración",
  href: "/admin/settings",
  icon: "⚙️",
  roles: ["admin"],
},
];