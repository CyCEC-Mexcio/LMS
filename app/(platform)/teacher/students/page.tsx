import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { StudentsProgressTracker, StudentProgressItem } from "@/components/teacher/students-progress-tracker";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/login");
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get all courses belonging to this teacher
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      sections (
        id,
        lessons (
          id
        )
      )
    `)
    .eq("teacher_id", profile.id);

  if (coursesError) {
    console.error("[TeacherStudentsPage] Error fetching teacher courses:", coursesError);
  }

  const teacherCourses = courses ?? [];
  const teacherCourseIds = teacherCourses.map((c) => c.id);

  // Map courseId -> lessonIds[] and lessonId -> course info
  const courseLessonsMap = new Map<string, string[]>();
  const lessonToCourseMap = new Map<string, { courseId: string; courseTitle: string }>();

  teacherCourses.forEach((course) => {
    const lessonIds: string[] = [];
    (course.sections ?? []).forEach((sec: any) => {
      (sec.lessons ?? []).forEach((l: any) => {
        if (l.id) {
          lessonIds.push(l.id);
          lessonToCourseMap.set(l.id, { courseId: course.id, courseTitle: course.title });
        }
      });
    });
    courseLessonsMap.set(course.id, lessonIds);
  });

  const allTeacherLessonIds = Array.from(lessonToCourseMap.keys());

  // 1. Fetch all progress records for any lesson in this teacher's courses
  let progressRecords: any[] = [];
  if (allTeacherLessonIds.length > 0) {
    try {
      const { data: progressData, error: progressError } = await adminSupabase
        .from("progress")
        .select("student_id, lesson_id, is_completed, completed_at")
        .in("lesson_id", allTeacherLessonIds);

      if (progressError) {
        console.error("[TeacherStudentsPage] Error fetching progress records:", progressError);
      }
      progressRecords = progressData ?? [];
    } catch (err) {
      console.error("[TeacherStudentsPage] Exception fetching progress records:", err);
    }
  }

  // 2. Fetch all enrollment records for this teacher's courses
  let enrollmentRecords: any[] = [];
  if (teacherCourseIds.length > 0) {
    try {
      const { data: enrollmentsData, error: enrollmentsError } = await adminSupabase
        .from("enrollments")
        .select("id, student_id, course_id, purchased_at, amount_paid")
        .in("course_id", teacherCourseIds);

      if (enrollmentsError) {
        console.error("[TeacherStudentsPage] Error fetching enrollment records:", enrollmentsError);
      }
      enrollmentRecords = enrollmentsData ?? [];
    } catch (err) {
      console.error("[TeacherStudentsPage] Exception fetching enrollment records:", err);
    }
  }

  // 3. Find all unique (student_id, course_id) pairs from both enrollments and progress
  const studentCoursesMap = new Map<string, { courseId: string; purchasedAt?: string }[]>();

  enrollmentRecords.forEach((e) => {
    if (!e.student_id || !e.course_id) return;
    const list = studentCoursesMap.get(e.student_id) || [];
    if (!list.some((item) => item.courseId === e.course_id)) {
      list.push({ courseId: e.course_id, purchasedAt: e.purchased_at });
      studentCoursesMap.set(e.student_id, list);
    }
  });

  progressRecords.forEach((p) => {
    if (!p.student_id || !p.lesson_id) return;
    const courseInfo = lessonToCourseMap.get(p.lesson_id);
    if (!courseInfo) return;
    const list = studentCoursesMap.get(p.student_id) || [];
    if (!list.some((item) => item.courseId === courseInfo.courseId)) {
      list.push({ courseId: courseInfo.courseId, purchasedAt: p.completed_at });
      studentCoursesMap.set(p.student_id, list);
    }
  });

  const allStudentIds = Array.from(studentCoursesMap.keys());

  // 4. Fetch profiles + Auth user data (emails & full names) for all discovered students
  const profilesMap = new Map<
    string,
    { id: string; full_name: string | null; email: string | null; avatar_url: string | null }
  >();

  if (allStudentIds.length > 0) {
    try {
      const { data: profilesData, error: profilesError } = await adminSupabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", allStudentIds);

      if (profilesError) {
        console.error("[TeacherStudentsPage] Error fetching profiles:", profilesError);
      }

      (profilesData ?? []).forEach((prof) => {
        profilesMap.set(prof.id, {
          id: prof.id,
          full_name: prof.full_name,
          email: null,
          avatar_url: prof.avatar_url,
        });
      });
    } catch (err) {
      console.error("[TeacherStudentsPage] Exception fetching profiles:", err);
    }

    // Query auth.admin to resolve user emails and names
    try {
      await Promise.all(
        allStudentIds.map(async (studentId) => {
          try {
            const { data: authUser, error: authUserError } = await adminSupabase.auth.admin.getUserById(studentId);
            if (authUserError) {
              console.warn(`[TeacherStudentsPage] auth.admin.getUserById(${studentId}) error:`, authUserError.message);
            }
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
          } catch (err) {
            console.error(`[TeacherStudentsPage] Error fetching user ${studentId} from auth.admin:`, err);
          }
        })
      );
    } catch (err) {
      console.error("[TeacherStudentsPage] Error batch resolving auth users:", err);
    }
  }

  // 5. Track completed lessons: Set<"studentId:lessonId">
  const completedSet = new Set<string>();
  progressRecords.forEach((p) => {
    if (p.is_completed) {
      completedSet.add(`${p.student_id}:${p.lesson_id}`);
    }
  });

  // 6. Build the student progress list
  const studentProgressList: StudentProgressItem[] = [];

  studentCoursesMap.forEach((courseList, studentId) => {
    const studentProfile = profilesMap.get(studentId);
    const studentName = studentProfile?.full_name || "Estudiante";
    const studentEmail = studentProfile?.email || "";
    const studentAvatar = studentProfile?.avatar_url || null;

    courseList.forEach(({ courseId, purchasedAt }) => {
      const course = teacherCourses.find((c) => c.id === courseId);
      const courseTitle = course?.title || "Curso";
      const lessonIds = courseLessonsMap.get(courseId) || [];
      const totalLessons = lessonIds.length;
      const completedLessons = lessonIds.filter((lId) =>
        completedSet.has(`${studentId}:${lId}`)
      ).length;
      const progressPct =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      studentProgressList.push({
        id: `${studentId}-${courseId}`,
        studentId,
        studentName,
        studentEmail,
        studentAvatar,
        courseId,
        courseTitle,
        purchasedAt: purchasedAt || new Date().toISOString(),
        completedLessons,
        totalLessons,
        progressPct,
      });
    });
  });

  const courseOptions = teacherCourses.map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Alumnos</h1>
        <p className="text-gray-600">
          Progreso, avance y seguimiento directo de todos los estudiantes inscritos en tus cursos.
        </p>
      </div>

      <StudentsProgressTracker
        initialStudents={studentProgressList}
        courses={courseOptions}
      />
    </div>
  );
}
