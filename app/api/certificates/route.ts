import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // ✅ FIX 1: Always pass cookieStore — calling createClient() without it
    // crashes with "Cannot read properties of undefined (reading 'getAll')"
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { courseId, studentId } = await request.json();

    if (!courseId || !studentId) {
      return NextResponse.json(
        { error: "courseId and studentId are required" },
        { status: 400 }
      );
    }

    // Get course info
    const { data: course } = await supabase
      .from("courses")
      .select("id, title, instructor_name")
      .eq("id", courseId)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // ✅ FIX 2: Get sections first, then lessons separately.
    // The nested query .select(`lessons (id)`) doesn't work when lessons
    // use section_id as a foreign key — it returns null for each section.
    const { data: sections } = await supabase
      .from("sections")
      .select("id")
      .eq("course_id", courseId);

    if (!sections || sections.length === 0) {
      return NextResponse.json(
        { error: "No sections found for this course" },
        { status: 404 }
      );
    }

    const sectionIds = sections.map((s: any) => s.id);

    // ✅ FIX 3: Query lessons by section_id, not as a nested relation
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, has_quiz")
      .in("section_id", sectionIds);

    if (!lessons || lessons.length === 0) {
      return NextResponse.json(
        { error: "No lessons found for this course" },
        { status: 404 }
      );
    }

    const lessonIds = lessons.map((l: any) => l.id);

    // Check if student has completed all lessons
    const { data: progress } = await supabase
      .from("progress")
      .select("lesson_id, is_completed")
      .eq("student_id", studentId)
      .in("lesson_id", lessonIds);

    const completedLessons = progress?.filter((p) => p.is_completed) || [];

    if (completedLessons.length < lessonIds.length) {
      return NextResponse.json(
        {
          error: "Course not completed",
          completed: completedLessons.length,
          total: lessonIds.length,
        },
        { status: 400 }
      );
    }

    // Check if student passed all quizzes
    const lessonsWithQuiz = lessons.filter((l: any) => l.has_quiz);

    if (lessonsWithQuiz.length > 0) {
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id")
        .in(
          "lesson_id",
          lessonsWithQuiz.map((l: any) => l.id)
        );

      if (quizzes && quizzes.length > 0) {
        const quizIds = quizzes.map((q) => q.id);

        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("quiz_id, passed")
          .eq("student_id", studentId)
          .in("quiz_id", quizIds)
          .eq("passed", true);

        if (!attempts || attempts.length < quizIds.length) {
          return NextResponse.json(
            {
              error: "Not all quizzes passed",
              quizzesPassed: attempts?.length || 0,
              quizzesTotal: quizIds.length,
            },
            { status: 400 }
          );
        }
      }
    }

    // Check if certificate already exists — return it if so
    const { data: existingCert } = await supabase
      .from("certificates")
      .select(`
        *,
        student:profiles!student_id (full_name),
        course:courses (title, instructor_name, organization)
      `)
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle(); // ✅ Use maybeSingle() instead of single() to avoid error when no row exists

    if (existingCert) {
      return NextResponse.json({ certificate: existingCert });
    }

    // Generate unique certificate number
    const certificateNumber = `CERT-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase()}`;

    // Create certificate
    const { data: certificate, error: insertError } = await supabase
      .from("certificates")
      .insert({
        student_id: studentId,
        course_id: courseId,
        certificate_number: certificateNumber,
      })
      .select(`
        *,
        student:profiles!student_id (full_name, email),
        course:courses (title, instructor_name, organization)
      `)
      .single();

    if (insertError) {
      console.error("Error creating certificate:", insertError);
      return NextResponse.json(
        { error: "Failed to create certificate", detail: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error("Unexpected error in certificate generation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { searchParams } = new URL(request.url);
    const certificateNumber = searchParams.get("certificateNumber");

    if (!certificateNumber) {
      return NextResponse.json(
        { error: "Certificate number required" },
        { status: 400 }
      );
    }

    const { data: certificate, error } = await supabase
      .from("certificates")
      .select(`
        *,
        student:profiles!student_id (full_name, email),
        course:courses (title, instructor_name, organization)
      `)
      .eq("certificate_number", certificateNumber)
      .maybeSingle();

    if (error || !certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}