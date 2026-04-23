import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function AdminChapterEditPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const { courseId, chapterId } = await params;

  // Redirect to the course editor page since chapters are managed there
  redirect(`/admin/courses/${courseId}`);
}
