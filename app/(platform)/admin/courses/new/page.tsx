import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import UnifiedCourseEditor from "@/components/course/unified-course-editor";

export default async function AdminNewCoursePage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div>
      <UnifiedCourseEditor isAdmin={true} />
    </div>
  );
}