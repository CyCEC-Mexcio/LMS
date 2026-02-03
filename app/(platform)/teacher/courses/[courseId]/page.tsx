import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import UnifiedCourseEditor from "@/components/course/unified-course-editor";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/");
  }

  const { courseId } = await params;

  return (
    <div>
      <UnifiedCourseEditor courseId={courseId} isAdmin={false} />
    </div>
  );
}