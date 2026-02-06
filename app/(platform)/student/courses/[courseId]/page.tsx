// app/(platform)/student/courses/[courseId]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import CoursePlayer from "@/components/course/course-player";

export default async function TakeCourse({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  // ✅ Unwrap params first
  const { courseId } = await params;

  const profile = await getUserProfile();

  if (!profile) {
    redirect(`/login?redirect=/student/courses/${courseId}`);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get course by slug or ID
  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      sections (
        id,
        title,
        position,
        lessons (
          id,
          title,
          description,
          video_url,
          video_provider,
          mux_playback_id,
          youtube_url,
          embed_code,
          content,
          duration_minutes,
          position,
          is_free_preview,
          resources,
          has_quiz,
          quizzes (
            id,
            title,
            passing_score,
            quiz_questions (
              id,
              question,
              question_type,
              options,
              correct_answer,
              explanation,
              position
            )
          )
        )
      )
    `)
    .or(`slug.eq.${courseId},id.eq.${courseId}`)
    .single();

  if (!course) {
    redirect("/browse");
  }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", profile.id)
    .eq("course_id", course.id)
    .single();

  if (!enrollment) {
    redirect(`/browse/${course.slug}`);
  }

  // Get all progress for this course
  const allLessonIds = course.sections.flatMap((s: any) =>
    s.lessons.map((l: any) => l.id)
  );

  const { data: progressData } = await supabase
    .from("progress")
    .select("*")
    .eq("student_id", profile.id)
    .in("lesson_id", allLessonIds);

  // Sort sections and lessons by position
  const sortedSections = course.sections
    .sort((a: any, b: any) => a.position - b.position)
    .map((section: any) => ({
      ...section,
      lessons: section.lessons.sort(
        (a: any, b: any) => a.position - b.position
      ),
    }));

  return (
    <CoursePlayer
      course={{
        ...course,
        sections: sortedSections,
      }}
      enrollmentId={enrollment.id}
      studentId={profile.id}
      progressData={progressData || []}
    />
  );
}
