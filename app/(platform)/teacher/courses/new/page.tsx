import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import UnifiedCourseEditor from "@/components/course/unified-course-editor";

export default async function NewCoursePage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/");
  }

  return (
    <div>
      <UnifiedCourseEditor isAdmin={false} />
    </div>
  );
}