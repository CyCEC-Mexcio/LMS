import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import LessonEditor from "@/components/course/lesson-editor";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string; lessonId: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/");
  }

  const { courseId, chapterId, lessonId } = await params;

  return (
    <LessonEditor
      courseId={courseId}
      chapterId={chapterId}
      lessonId={lessonId}
      isAdmin={false}
    />
  );
}