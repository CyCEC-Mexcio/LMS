import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import UnifiedCourseEditor from "@/components/course/unified-course-editor";

export default async function AdminEditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const { courseId } = await params;

  return (
    <div>
      <UnifiedCourseEditor courseId={courseId} isAdmin={true} />
    </div>
  );
}