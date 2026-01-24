export type NavItem = {
  title: string;
  href: string;
  icon: string;
  roles: ("student" | "teacher" | "admin")[];
};

export const navigationItems: NavItem[] = [
  {
    title: "Explorar Cursos",
    href: "/browse",
    icon: "📚",
    roles: ["student", "teacher", "admin"],
  },
  {
    title: "Mi Aprendizaje",
    href: "/student",
    icon: "🎓",
    roles: ["student", "teacher"],
  },
  {
    title: "Mi Progreso",
    href: "/student/progress",
    icon: "📊",
    roles: ["student", "teacher"],
  },
  {
    title: "Mis Certificados",
    href: "/student/certificates",
    icon: "🏆",
    roles: ["student", "teacher"],
  },
  // Teacher only
  {
    title: "Crear Curso",
    href: "/teacher/courses/new",
    icon: "➕",
    roles: ["teacher", "admin"],
  },
  {
    title: "Mis Cursos",
    href: "/teacher",
    icon: "📝",
    roles: ["teacher", "admin"],
  },
  {
    title: "Analíticas",
    href: "/teacher/analytics",
    icon: "📈",
    roles: ["teacher", "admin"],
  },
  {
    title: "Ganancias",
    href: "/teacher/earnings",
    icon: "💰",
    roles: ["teacher", "admin"],
  },
  // Admin only
  {
    title: "Gestionar Usuarios",
    href: "/admin/users",
    icon: "👥",
    roles: ["admin"],
  },
  {
    title: "Gestionar Cursos",
    href: "/admin/courses",
    icon: "🎓",
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
    href: "/admin/payments",
    icon: "💳",
    roles: ["admin"],
  },
];