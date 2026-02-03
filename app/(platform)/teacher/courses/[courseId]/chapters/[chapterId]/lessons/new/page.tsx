import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import LessonEditor from "@/components/course/lesson-editor";

export default async function TeacherNewLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/");
  }

  const { courseId, chapterId } = await params;

  return (
    <LessonEditor
      courseId={courseId}
      chapterId={chapterId}
      lessonId={undefined}  // Pass undefined for new lessons
      isAdmin={false}
    />
  );
}