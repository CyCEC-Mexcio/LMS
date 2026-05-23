// app/(platform)/browse/[slug]/preview/[lessonId]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CoursePlayer from "@/components/course/course-player";

export default async function FreePreviewPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const supabase = await createClient();

  // Fetch the course by slug (must be published + approved)
  const { data: course } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      instructor_name,
      certificate_type,
      slug,
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
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_approved", true)
    .single();

  if (!course) notFound();

  // Verify the requested lesson exists and is marked as free preview
  let targetLesson = null;
  for (const section of course.sections || []) {
    for (const lesson of section.lessons || []) {
      if (lesson.id === lessonId && lesson.is_free_preview) {
        targetLesson = lesson;
        break;
      }
    }
    if (targetLesson) break;
  }

  if (!targetLesson) {
    // Lesson not found or not free — redirect back to course detail
    redirect(`/browse/${slug}`);
  }

  // Build a trimmed course with ONLY the free preview lesson
  // so the student can only view that single lesson
  const previewSection = {
    id: "preview-section",
    title: "Vista Previa Gratuita",
    position: 1,
    lessons: [
      {
        ...targetLesson,
        position: 1,
      },
    ],
  };

  const previewCourse = {
    id: course.id,
    title: course.title,
    description: course.description,
    instructor_name: course.instructor_name,
    certificate_type: course.certificate_type,
    sections: [previewSection],
  };

  return (
    <CoursePlayer
      course={previewCourse}
      enrollmentId=""
      studentId=""
      progressData={[]}
      isPreview={true}
      previewBackUrl={`/browse/${slug}`}
    />
  );
}
