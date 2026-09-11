// app/(platform)/student/courses/[courseId]/page.tsx
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import CoursePlayer from "@/components/course/course-player";
import { stripe } from "@/lib/stripe";

export default async function TakeCourse({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ✅ Unwrap params first
  const { courseId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionId = typeof resolvedSearchParams.session_id === "string" 
    ? resolvedSearchParams.session_id 
    : undefined;

  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((c) => c.name);

  const profile = await getUserProfile();

  console.log("🔍 [DIAGNOSTIC: student_course_page_auth_check]", {
    courseId,
    hasProfile: !!profile,
    profileId: profile?.id,
    cookieNames,
    sessionId,
  });

  if (!profile) {
    redirect(`/login?redirect=/student/courses/${courseId}`);
  }

  const supabase = await createClient();

  // Get course by slug or ID
  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      sections (
        id,
        title,
        position,
        lessons (
          id,
          title,
          description,
          video_url,
          video_provider,
          mux_playback_id,
          youtube_url,
          embed_code,
          content,
          duration_seconds,
          duration_minutes,
          position,
          is_free_preview,
          resources,
          has_quiz,
          quizzes (
            id,
            title,
            passing_score,
            quiz_questions (
              id,
              question,
              question_type,
              options,
              correct_answer,
              explanation,
              position
            )
          )
        )
      )
    `)
    .or(`slug.eq.${courseId},id.eq.${courseId}`)
    .single();

  if (!course) {
    redirect("/browse");
  }

  // Check enrollment
  let { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", profile.id)
    .eq("course_id", course.id)
    .single();

  // If enrollment not found yet and coming from checkout, verify session directly with Stripe
  if (!enrollment && sessionId) {
    console.log("💳 Verifying Stripe checkout session on redirect:", sessionId);
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        stripeSession.payment_status === "paid" &&
        (stripeSession.metadata?.courseId === course.id || stripeSession.metadata?.courseId === courseId) &&
        stripeSession.metadata?.studentId === profile.id
      ) {
        const adminClient = createAdminClient();

        // Check if already created by webhook concurrently
        const { data: existing } = await adminClient
          .from("enrollments")
          .select("*")
          .eq("student_id", profile.id)
          .eq("course_id", course.id)
          .single();

        if (existing) {
          enrollment = existing;
        } else {
          const totalAmount = parseFloat(stripeSession.metadata?.totalAmount || "0");
          const platformFee = parseFloat(stripeSession.metadata?.platformFee || "0");
          const instructorEarnings = parseFloat(stripeSession.metadata?.instructorEarnings || "0");
          const commissionRate = parseFloat(stripeSession.metadata?.commissionRate || "0.15");

          const { data: newEnrollment, error: enrollError } = await adminClient
            .from("enrollments")
            .insert({
              student_id: profile.id,
              course_id: course.id,
              payment_method: "stripe",
              payment_id: stripeSession.payment_intent as string,
              amount_paid: totalAmount,
            })
            .select()
            .single();

          if (!enrollError && newEnrollment) {
            enrollment = newEnrollment;
            console.log("✅ Enrollment verified & created on redirect:", enrollment.id);

            // Record transaction
            await adminClient.from("transactions").insert({
              enrollment_id: enrollment.id,
              course_id: course.id,
              instructor_id: stripeSession.metadata?.instructorId || course.teacher_id,
              student_id: profile.id,
              payment_provider: "stripe",
              payment_intent_id: stripeSession.payment_intent as string,
              total_amount: totalAmount,
              platform_fee: platformFee,
              instructor_earnings: instructorEarnings,
              commission_rate: commissionRate,
              status: "completed",
              paid_out: false,
            });
          } else if (enrollError) {
            console.error("❌ Failed to create enrollment on redirect:", enrollError);
          }
        }
      }
    } catch (err) {
      console.error("❌ Error verifying Stripe session on redirect:", err);
    }
  }

  if (!enrollment) {
    redirect(`/browse/${course.slug}`);
  }

  // Get all progress for this course
  const allLessonIds = course.sections.flatMap((s: any) =>
    s.lessons.map((l: any) => l.id)
  );

  const { data: progressData } = await supabase
    .from("progress")
    .select("*")
    .eq("student_id", profile.id)
    .in("lesson_id", allLessonIds);

  // Sort sections and lessons by position
  const sortedSections = course.sections
    .sort((a: any, b: any) => a.position - b.position)
    .map((section: any) => ({
      ...section,
      lessons: section.lessons.sort(
        (a: any, b: any) => a.position - b.position
      ),
    }));

  return (
    <CoursePlayer
      course={{
        ...course,
        sections: sortedSections,
      }}
      enrollmentId={enrollment.id}
      studentId={profile.id}
      progressData={progressData || []}
    />
  );
}
