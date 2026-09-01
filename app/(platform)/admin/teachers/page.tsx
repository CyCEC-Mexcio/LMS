import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import {
  TeacherHierarchyManager,
  TeacherSummaryItem,
} from "@/components/admin/teacher-hierarchy-manager";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const supabase = await createClient();

  // 1. Fetch all teacher profiles
  const { data: teacherProfiles, error: teachersError } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, created_at")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });

  if (teachersError) {
    console.error("[AdminTeachersPage] Error fetching teachers:", teachersError);
  }

  const teachers = teacherProfiles ?? [];
  const teacherIds = teachers.map((t) => t.id);

  // 2. Fetch lightweight course & enrollment counts without deep N+1 lookups
  let courseCountMap = new Map<string, number>();
  let studentCountMap = new Map<string, number>();

  if (teacherIds.length > 0) {
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select(`
        id,
        teacher_id,
        enrollments (
          id,
          student_id
        )
      `)
      .in("teacher_id", teacherIds);

    if (coursesError) {
      console.error("[AdminTeachersPage] Error fetching courses count:", coursesError);
    }

    (courses ?? []).forEach((c) => {
      if (!c.teacher_id) return;
      const currentCourses = courseCountMap.get(c.teacher_id) || 0;
      courseCountMap.set(c.teacher_id, currentCourses + 1);

      const enrollments = c.enrollments ?? [];
      const currentStudents = studentCountMap.get(c.teacher_id) || 0;
      studentCountMap.set(c.teacher_id, currentStudents + enrollments.length);
    });
  }

  // 3. Assemble lightweight summary for Level 1
  const teacherSummaries: TeacherSummaryItem[] = teachers.map((t) => ({
    id: t.id,
    fullName: t.full_name || "Instructor",
    email: null,
    avatarUrl: t.avatar_url,
    coursesCount: courseCountMap.get(t.id) || 0,
    totalStudentsCount: studentCountMap.get(t.id) || 0,
    createdAt: t.created_at,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Instructores</h1>
        <p className="text-gray-600">
          Supervisa los profesores de la plataforma, sus cursos e inscripciones con desglose y bajas administrativas.
        </p>
      </div>

      <TeacherHierarchyManager initialTeachers={teacherSummaries} />
    </div>
  );
}
