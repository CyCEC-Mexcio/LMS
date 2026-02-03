import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import CourseApprovalForm from "@/components/course/course-approval-form";

export default async function CourseApprovalPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const { courseId } = await params;
  const supabase = createClient(await cookies());

  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      profiles:teacher_id (
        full_name,
        avatar_url
      )
    `)
    .eq("id", courseId)
    .single();

  if (!course) {
    redirect("/admin/courses");
  }

  return (
    <CourseApprovalForm course={course} adminId={profile.id} />
  );
}