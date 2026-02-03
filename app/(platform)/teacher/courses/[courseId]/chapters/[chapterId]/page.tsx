import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function TeacherChapterEditPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>; // Changed: params is now a Promise
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/");
  }

  // Await params to get both IDs
  const { courseId, chapterId } = await params;

  return (
    <div>
      <h1>Edit Chapter: {chapterId}</h1>
      <p>Course: {courseId}</p>
      <p>Coming soon...</p>
    </div>
  );
}