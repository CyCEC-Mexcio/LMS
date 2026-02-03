import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>; // Changed: params is now a Promise
}) {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Await params to get courseId
  const { courseId } = await params;

  return (
    <div>
      <h1>Student Course: {courseId}</h1>
      <p>Coming soon...</p>
    </div>
  );
}