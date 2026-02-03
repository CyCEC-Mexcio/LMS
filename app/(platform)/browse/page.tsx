import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import CourseCard from "@/components/course-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { link } from "fs";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const supabase = createClient(await cookies());

  const params = await searchParams;

  // Build query for published and approved courses WITH sections and lessons
  let query = supabase
    .from("courses")
    .select(
      `
      *,
      profiles:teacher_id (
        full_name
      ),
      enrollments (
        id
      ),
      reviews (
        rating
      ),
      sections (
        id,
        lessons (id)
      )
    `
    )
    .eq("is_published", true)
    .eq("is_approved", true);

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
    );
  }

  const { data: courses } = await query.order("created_at", {
    ascending: false,
  });

  const { data: allCourses } = await supabase
    .from("courses")
    .select("category")
    .eq("is_published", true)
    .eq("is_approved", true);

  const categories = Array.from(
    new Set(allCourses?.map((c) => c.category).filter(Boolean))
  );

  const coursesWithStats = courses?.map((course) => {
    const enrollmentCount = course.enrollments?.length || 0;
    const reviews = course.reviews || [];
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          reviews.length
        : 0;

    // Calculate total chapters and lessons
    const totalChapters = course.sections?.length || 0;
    const totalLessons =
      course.sections?.reduce(
        (acc: number, section: any) => acc + (section.lessons?.length || 0),
        0
      ) || 0;

    return {
      ...course,
      enrollmentCount,
      averageRating,
      reviewCount: reviews.length,
      totalChapters,
      totalLessons,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Explorar Cursos
          </h1>
          <p className="text-lg text-gray-600">
            Descubre y aprende con nuestros cursos profesionales
          </p>
        </div>

        <div className="mb-8">
          <form action="/browse" method="get" className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              name="search"
              placeholder="Buscar cursos..."
              defaultValue={params.search}
              className="pl-10 w-full max-w-2xl"
            />
          </form>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <a href="/browse">
            <Badge
              variant={!params.category ? "default" : "outline"}
              className="cursor-pointer hover:bg-blue-600 hover:text-white transition-colors"
            >
              Todos
            </Badge>
          </a>
          {categories.map((category) => (
            <a key={category} href={`/browse?category=${category}`}>
              <Badge
                variant={params.category === category ? "default" : "outline"}
                className="cursor-pointer hover:bg-blue-600 hover:text-white transition-colors"
              >
                {category}
              </Badge>
            </a>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {coursesWithStats?.length || 0} cursos encontrados
            {params.category && ` en ${params.category}`}
            {params.search && ` para "${params.search}"`}
          </p>
        </div>

        {coursesWithStats && coursesWithStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesWithStats.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                thumbnail={course.thumbnail_url}
                instructor={course.instructor_name}
                category={course.category}
                price={course.price}
                level={course.level}
                slug={course.slug}
                enrollmentCount={course.enrollmentCount}
                averageRating={course.averageRating}
                reviewCount={course.reviewCount}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron cursos
            </h3>
            <p className="text-gray-600 mb-4">
              {params.search || params.category
                ? "Intenta con otros términos de búsqueda"
                : "Aún no hay cursos disponibles"}
            </p>
            {(params.search || params.category) && (
              <link>
                href="/browse"
                className="text-blue-600 hover:text-blue-800 font-medium"
              
                Ver todos los cursos
              </link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}