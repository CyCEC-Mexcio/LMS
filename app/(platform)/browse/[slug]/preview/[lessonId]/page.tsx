// app/(platform)/browse/[slug]/preview/[lessonId]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import StudentPreviewPlayer from "@/components/course/student-preview-player";

export default async function FreePreviewPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const supabase = await createClient();

  // Fetch the course by slug with pricing details
  const { data: course } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      instructor_name,
      certificate_type,
      slug,
      price,
      currency,
      is_published,
      is_approved,
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
          has_quiz
        )
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_approved", true)
    .single();

  if (!course) notFound();

  // Check if student is currently enrolled (if logged in)
  const { data: { user } } = await supabase.auth.getUser();
  let isEnrolled = false;
  
  if (user) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", course.id)
      .eq("student_id", user.id)
      .single();
    isEnrolled = !!enrollment;
  }

  // Sort sections and lessons by position to keep chronological curriculum
  const sortedSections = (course.sections || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((section: any) => ({
      ...section,
      lessons: (section.lessons || []).sort(
        (a: any, b: any) => a.position - b.position
      ),
    }));

  // Verify the requested lesson exists and is indeed a free preview
  let targetLesson = null;
  for (const section of sortedSections) {
    for (const lesson of section.lessons) {
      if (lesson.id === lessonId && lesson.is_free_preview) {
        targetLesson = lesson;
        break;
      }
    }
    if (targetLesson) break;
  }

  if (!targetLesson) {
    // Redirect to parent course detail page if not a valid free preview lesson
    redirect(`/browse/${slug}`);
  }

  return (
    <StudentPreviewPlayer
      course={{
        ...course,
        sections: sortedSections,
      }}
      initialLessonId={lessonId}
      isEnrolled={isEnrolled}
    />
  );
}
