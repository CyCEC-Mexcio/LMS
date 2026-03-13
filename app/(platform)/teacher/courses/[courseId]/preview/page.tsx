// app/(platform)/teacher/courses/[courseId]/preview/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import CoursePlayer from "@/components/course/course-player";

export default async function TeacherCoursePreview({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/");
  }

  const supabase = await createClient();

  // Fetch course and verify ownership
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
    .eq("id", courseId)
    .eq("teacher_id", profile.id)
    .single();

  if (!course) {
    redirect("/teacher/courses");
  }

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
      enrollmentId=""
      studentId=""
      progressData={[]}
      isPreview={true}
      previewBackUrl={`/teacher/courses/${courseId}`}
    />
  );
}
