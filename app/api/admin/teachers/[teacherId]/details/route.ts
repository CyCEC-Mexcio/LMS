import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const { teacherId } = await params;

    if (!teacherId) {
      return NextResponse.json(
        { error: "ID de instructor inválido" },
        { status: 400 }
      );
    }

    // ── 1. Verify caller is authenticated and is an Admin ──────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Acceso denegado: solo administradores" },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();

    // ── 2. Fetch all courses for this specific teacher ─────────────────────
    const { data: courses, error: coursesError } = await adminSupabase
      .from("courses")
      .select(`
        id,
        title,
        slug,
        thumbnail_url,
        price,
        is_published,
        is_approved,
        created_at,
        sections (
          id,
          lessons (
            id
          )
        )
      `)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (coursesError) {
      console.error("[TeacherDetailsAPI] Error fetching courses:", coursesError);
      return NextResponse.json({ error: coursesError.message }, { status: 500 });
    }

    const teacherCourses = courses ?? [];
    const teacherCourseIds = teacherCourses.map((c) => c.id);

    if (teacherCourseIds.length === 0) {
      return NextResponse.json({
        teacherId,
        courses: [],
      });
    }

    // Map courseId -> lessonIds[]
    const courseLessonsMap = new Map<string, string[]>();
    const allLessonIds: string[] = [];

    teacherCourses.forEach((c) => {
      const lessonIds: string[] = [];
      (c.sections ?? []).forEach((sec: any) => {
        (sec.lessons ?? []).forEach((l: any) => {
          if (l.id) {
            lessonIds.push(l.id);
            allLessonIds.push(l.id);
          }
        });
      });
      courseLessonsMap.set(c.id, lessonIds);
    });

    // ── 3. Fetch enrollments for this teacher's courses ────────────────────
    const { data: enrollments, error: enrollmentsError } = await adminSupabase
      .from("enrollments")
      .select("id, student_id, course_id, purchased_at, amount_paid")
      .in("course_id", teacherCourseIds)
      .order("purchased_at", { ascending: false });

    if (enrollmentsError) {
      console.error("[TeacherDetailsAPI] Error fetching enrollments:", enrollmentsError);
    }

    const enrollmentList = enrollments ?? [];
    const uniqueStudentIds = Array.from(
      new Set(enrollmentList.map((e) => e.student_id).filter(Boolean))
    );

    // ── 4. Fetch progress records for lessons in these courses ──────────────
    let progressRecords: any[] = [];
    if (allLessonIds.length > 0 && uniqueStudentIds.length > 0) {
      try {
        const { data: progressData } = await adminSupabase
          .from("progress")
          .select("student_id, lesson_id, is_completed, completed_at")
          .in("lesson_id", allLessonIds)
          .in("student_id", uniqueStudentIds);

        progressRecords = progressData ?? [];
      } catch (pErr) {
        console.error("[TeacherDetailsAPI] Error fetching progress:", pErr);
      }
    }

    // Completed lessons set: "studentId:lessonId"
    const completedSet = new Set<string>();
    progressRecords.forEach((p) => {
      if (p.is_completed) {
        completedSet.add(`${p.student_id}:${p.lesson_id}`);
      }
    });

    // ── 5. Fetch profiles + user emails via auth.admin ──────────────────────
    const profilesMap = new Map<
      string,
      { id: string; full_name: string | null; email: string | null; avatar_url: string | null }
    >();

    if (uniqueStudentIds.length > 0) {
      try {
        const { data: profilesData } = await adminSupabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", uniqueStudentIds);

        (profilesData ?? []).forEach((prof) => {
          profilesMap.set(prof.id, {
            id: prof.id,
            full_name: prof.full_name,
            email: null,
            avatar_url: prof.avatar_url,
          });
        });

        await Promise.all(
          uniqueStudentIds.map(async (studentId) => {
            try {
              const { data: authUser } = await adminSupabase.auth.admin.getUserById(studentId);
              if (authUser?.user) {
                const u = authUser.user;
                const existing = profilesMap.get(studentId);
                const resolvedName =
                  existing?.full_name ||
                  u.user_metadata?.full_name ||
                  u.user_metadata?.name ||
                  (u.email ? u.email.split("@")[0] : "Estudiante");
                const resolvedEmail = u.email || "";
                const resolvedAvatar =
                  existing?.avatar_url ||
                  u.user_metadata?.avatar_url ||
                  u.user_metadata?.picture ||
                  null;

                profilesMap.set(studentId, {
                  id: studentId,
                  full_name: resolvedName,
                  email: resolvedEmail,
                  avatar_url: resolvedAvatar,
                });
              }
            } catch (authErr) {
              console.warn(`[TeacherDetailsAPI] Error getting user ${studentId} from auth.admin:`, authErr);
            }
          })
        );
      } catch (profErr) {
        console.error("[TeacherDetailsAPI] Error resolving profiles:", profErr);
      }
    }

    // ── 6. Assemble courses with their enrolled students ──────────────────
    const coursesWithStudents = teacherCourses.map((course) => {
      const lessonIds = courseLessonsMap.get(course.id) || [];
      const totalLessons = lessonIds.length;

      const courseEnrollments = enrollmentList.filter((e) => e.course_id === course.id);

      const students = courseEnrollments.map((e) => {
        const profileInfo = profilesMap.get(e.student_id);
        const studentName = profileInfo?.full_name || "Estudiante";
        const studentEmail = profileInfo?.email || "";
        const studentAvatar = profileInfo?.avatar_url || null;

        const completedLessons = lessonIds.filter((lId) =>
          completedSet.has(`${e.student_id}:${lId}`)
        ).length;

        const progressPct =
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          enrollmentId: e.id,
          studentId: e.student_id,
          studentName,
          studentEmail,
          studentAvatar,
          purchasedAt: e.purchased_at,
          amountPaid: e.amount_paid,
          completedLessons,
          totalLessons,
          progressPct,
        };
      });

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnailUrl: course.thumbnail_url,
        price: course.price,
        isPublished: course.is_published,
        isApproved: course.is_approved,
        totalLessons,
        studentCount: students.length,
        students,
      };
    });

    return NextResponse.json({
      teacherId,
      courses: coursesWithStudents,
    });
  } catch (error: any) {
    console.error("[TeacherDetailsAPI] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener detalles del instructor" },
      { status: 500 }
    );
  }
}
