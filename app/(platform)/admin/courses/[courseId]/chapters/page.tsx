import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import ChapterManager from "@/components/course/chapter-manager";

export default async function AdminChaptersPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const { courseId } = await params;

  return <ChapterManager courseId={courseId} isAdmin={true} />;
}
