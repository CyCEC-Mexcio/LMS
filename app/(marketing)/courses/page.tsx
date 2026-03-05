// app/(marketing)/courses/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Star, Filter } from "lucide-react";

// Level label helper
function levelLabel(level: string | null) {
  if (level === "beginner")     return "Principiante";
  if (level === "intermediate") return "Intermedio";
  if (level === "advanced")     return "Avanzado";
  return level || "General";
}

function levelColor(level: string | null) {
  if (level === "beginner")     return "bg-green-100 text-green-700";
  if (level === "intermediate") return "bg-yellow-100 text-yellow-700";
  if (level === "advanced")     return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export default async function PublicCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; level?: string; q?: string }>;
}) {
  const { category, level, q } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // ✅ Fetch all published + approved courses — no auth required
  // RLS must allow public SELECT on courses where is_published = true
  let query = supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      description,
      thumbnail_url,
      price,
      currency,
      level,
      category,
      instructor_name,
      organization,
      certificate_type,
      what_you_will_learn
    `)
    .eq("is_published", true)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (level)    query = query.eq("level", level);
  if (q)        query = query.ilike("title", `%${q}%`);

  const { data: courses, error } = await query;

  // Get unique categories for filter pills
  const { data: allCourses } = await supabase
    .from("courses")
    .select("category")
    .eq("is_published", true)
    .eq("is_approved", true);

  const categories = Array.from(
    new Set((allCourses || []).map((c) => c.category).filter(Boolean))
  ) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="bg-[#8E0F14] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Nuestros Cursos</h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Desarrolla tus habilidades con cursos diseñados por expertos
          </p>

          {/* Search bar */}
          <form method="GET" className="flex max-w-lg mx-auto gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Buscar cursos..."
              className="flex-1 px-4 py-2 rounded-lg text-gray-900 border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-white text-[#8E0F14] font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Filter row */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 items-center">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Filter className="w-4 h-4" /> Categoría:
            </span>
            <Link href="/courses">
              <span
                className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                  !category
                    ? "bg-[#8E0F14] text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Todos
              </span>
            </Link>
            {categories.map((cat) => (
              <Link key={cat} href={`/courses?category=${encodeURIComponent(cat)}`}>
                <span
                  className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                    category === cat
                      ? "bg-[#8E0F14] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {cat}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-6">
          {courses?.length || 0} curso{(courses?.length || 0) !== 1 ? "s" : ""} disponible
          {(courses?.length || 0) !== 1 ? "s" : ""}
          {q && ` para "${q}"`}
          {category && ` en ${category}`}
        </p>

        {/* Empty state */}
        {(!courses || courses.length === 0) && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No se encontraron cursos
            </h2>
            <p className="text-gray-500 mb-6">
              {q
                ? "Intenta con otra búsqueda"
                : "Próximamente habrá más cursos disponibles"}
            </p>
            {q && (
              <Link href="/courses">
                <Button variant="outline">Ver todos los cursos</Button>
              </Link>
            )}
          </div>
        )}

        {/* Course grid */}
        {courses && courses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/browse/${course.slug}`}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-[#8E0F14] to-[#C4161C] overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/40" />
                    </div>
                  )}
                  {/* Certificate badge */}
                  {course.certificate_type && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        {course.certificate_type === "certificate"
                          ? "🏆 Certificado"
                          : "📋 Constancia"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  {/* Category + level */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {course.category && (
                      <Badge variant="secondary" className="text-xs">
                        {course.category}
                      </Badge>
                    )}
                    {course.level && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor(course.level)}`}
                      >
                        {levelLabel(course.level)}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#8E0F14] transition-colors">
                    {course.title}
                  </h3>

                  {/* Description */}
                  {course.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
                      {course.description}
                    </p>
                  )}

                  {/* Instructor */}
                  {course.instructor_name && (
                    <p className="text-xs text-gray-400 mb-3">
                      Por <span className="font-medium text-gray-600">{course.instructor_name}</span>
                      {course.organization && ` · ${course.organization}`}
                    </p>
                  )}

                  {/* What you'll learn preview */}
                  {course.what_you_will_learn &&
                    (course.what_you_will_learn as string[]).length > 0 && (
                      <ul className="text-xs text-gray-500 mb-3 space-y-1">
                        {(course.what_you_will_learn as string[])
                          .slice(0, 2)
                          .map((item, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-green-500 flex-shrink-0">✓</span>
                              <span className="line-clamp-1">{item}</span>
                            </li>
                          ))}
                      </ul>
                    )}

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <div>
                      {course.price && Number(course.price) > 0 ? (
                        <span className="font-bold text-gray-900">
                          ${Number(course.price).toLocaleString("es-MX")}{" "}
                          <span className="text-xs font-normal text-gray-500">
                            {course.currency || "MXN"}
                          </span>
                        </span>
                      ) : (
                        <span className="font-bold text-green-600">Gratis</span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-[#8E0F14] group-hover:underline">
                      Ver curso →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA for non-logged-in users */}
        <div className="mt-16 bg-[#8E0F14] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">¿Listo para empezar?</h2>
          <p className="text-white/80 mb-6">
            Crea tu cuenta gratis y accede a todos nuestros cursos
          </p>
          <Link href="/login">
            <Button className="bg-white text-[#8E0F14] hover:bg-white/90 font-semibold px-8">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}