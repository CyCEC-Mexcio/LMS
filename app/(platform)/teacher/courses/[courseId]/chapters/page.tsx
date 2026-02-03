import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import ChapterManager from "@/components/course/chapter-manager";

export default async function TeacherChaptersPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/");
  }

  const { courseId } = await params;

  return <ChapterManager courseId={courseId} isAdmin={false} />;
}