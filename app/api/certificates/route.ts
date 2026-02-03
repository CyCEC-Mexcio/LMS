import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { courseId, studentId } = await request.json();

    // Verify student has completed the course
    const { data: course } = await supabase
      .from("courses")
      .select("id, title, instructor_name")
      .eq("id", courseId)
      .single();

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Get all lessons in the course
    const { data: sections } = await supabase
      .from("sections")
      .select(`
        id,
        lessons (
          id,
          has_quiz
        )
      `)
      .eq("course_id", courseId);

    if (!sections) {
      return NextResponse.json(
        { error: "No lessons found" },
        { status: 404 }
      );
    }

    // Get all lesson IDs
    const allLessons = sections.flatMap((s: any) => s.lessons);
    const lessonIds = allLessons.map((l: any) => l.id);

    // Check if student has completed all lessons
    const { data: progress } = await supabase
      .from("progress")
      .select("lesson_id, is_completed")
      .eq("student_id", studentId)
      .in("lesson_id", lessonIds);

    const completedLessons = progress?.filter((p) => p.is_completed) || [];

    if (completedLessons.length !== lessonIds.length) {
      return NextResponse.json(
        { 
          error: "Course not completed",
          completed: completedLessons.length,
          total: lessonIds.length
        },
        { status: 400 }
      );
    }

    // Check if student passed all quizzes
    const lessonsWithQuiz = allLessons.filter((l: any) => l.has_quiz);
    
    if (lessonsWithQuiz.length > 0) {
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id")
        .in("lesson_id", lessonsWithQuiz.map((l: any) => l.id));

      if (quizzes && quizzes.length > 0) {
        const quizIds = quizzes.map((q) => q.id);
        
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("quiz_id, passed")
          .eq("student_id", studentId)
          .in("quiz_id", quizIds)
          .eq("passed", true);

        if (!attempts || attempts.length !== quizIds.length) {
          return NextResponse.json(
            { error: "Not all quizzes passed" },
            { status: 400 }
          );
        }
      }
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from("certificates")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .single();

    if (existingCert) {
      return NextResponse.json({ certificate: existingCert });
    }

    // Generate unique certificate number
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create certificate
    const { data: certificate, error } = await supabase
      .from("certificates")
      .insert({
        student_id: studentId,
        course_id: courseId,
        certificate_number: certificateNumber,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating certificate:", error);
      return NextResponse.json(
        { error: "Failed to create certificate" },
        { status: 500 }
      );
    }

    // TODO: Send email notification to student with certificate

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error("Error in certificate generation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const certificateNumber = searchParams.get("certificateNumber");

    if (!certificateNumber) {
      return NextResponse.json(
        { error: "Certificate number required" },
        { status: 400 }
      );
    }

    // Verify certificate
    const { data: certificate, error } = await supabase
      .from("certificates")
      .select(`
        *,
        student:profiles!student_id (full_name, email),
        course:courses (title, instructor_name, organization)
      `)
      .eq("certificate_number", certificateNumber)
      .single();

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