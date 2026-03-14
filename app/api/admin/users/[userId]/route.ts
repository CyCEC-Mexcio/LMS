// app/api/admin/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (adminProfile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url, bio, platform_fee_percent, created_at")
      .eq("id", userId).single();
    if (error || !profile) return NextResponse.json({ error: "User not found" }, { status: 404 });
    let email: string | null = null;
    try { const { data: au } = await supabase.auth.admin.getUserById(userId); email = au?.user?.email ?? null; } catch {}
    let details: any = null;
    if (profile.role === "student") details = await loadStudentDetails(supabase, userId);
    else if (profile.role === "teacher") details = await loadTeacherDetails(supabase, userId);
    else if (profile.role === "admin") details = await loadAdminDetails(supabase, userId);
    return NextResponse.json({ profile: { ...profile, email }, details });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (adminProfile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { full_name, bio, avatar_url, platform_fee_percent } = await req.json();
    if (platform_fee_percent !== undefined) {
      const fee = Number(platform_fee_percent);
      if (isNaN(fee) || fee < 0 || fee > 100) return NextResponse.json({ error: "Invalid fee percentage" }, { status: 400 });
    }
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = full_name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (platform_fee_percent !== undefined) updates.platform_fee_percent = Number(platform_fee_percent);
    const { error: updateError } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    if (platform_fee_percent !== undefined) {
      const rate = Number(platform_fee_percent) / 100;
      const { data: txs } = await supabase.from("transactions").select("id, total_amount")
        .eq("instructor_id", userId).eq("paid_out", false).eq("status", "completed");
      if (txs?.length) await Promise.all(txs.map((tx: any) =>
        supabase.from("transactions").update({
          platform_fee: Number(tx.total_amount) * rate,
          instructor_earnings: Number(tx.total_amount) * (1 - rate),
          commission_rate: rate,
        }).eq("id", tx.id)
      ));
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function loadStudentDetails(supabase: any, userId: string) {
  const { data: enrollments } = await supabase
    .from("enrollments").select("*, courses(id, title, thumbnail_url, category, price)")
    .eq("student_id", userId).order("purchased_at", { ascending: false });
  const coursesWithProgress = await Promise.all((enrollments ?? []).map(async (e: any) => {
    const { data: sections } = await supabase.from("sections").select("id, lessons(id)").eq("course_id", e.course_id);
    const ids = (sections ?? []).flatMap((s: any) => s.lessons.map((l: any) => l.id));
    const { data: done } = await supabase.from("progress").select("lesson_id")
      .eq("student_id", userId).eq("is_completed", true).in("lesson_id", ids.length ? ids : ["none"]);
    const progress = ids.length > 0 ? Math.round(((done?.length ?? 0) / ids.length) * 100) : 0;
    return { ...e, progress, completedLessons: done?.length ?? 0, totalLessons: ids.length };
  }));
  const { data: certificates } = await supabase.from("certificates").select("*, courses(title)").eq("student_id", userId);
  const totalSpent = (enrollments ?? []).reduce((s: number, e: any) => s + (Number(e.amount_paid) || 0), 0);
  return {
    enrollments: coursesWithProgress, certificates: certificates ?? [],
    stats: { totalCourses: enrollments?.length ?? 0, completedCourses: coursesWithProgress.filter((c: any) => c.progress === 100).length, certificatesEarned: certificates?.length ?? 0, totalSpent },
  };
}

async function loadTeacherDetails(supabase: any, userId: string) {
  const { data: courses } = await supabase.from("courses")
    .select("id, title, thumbnail_url, category, price, is_published, is_approved, created_at")
    .eq("teacher_id", userId).order("created_at", { ascending: false });
  const coursesWithStats = await Promise.all((courses ?? []).map(async (c: any) => {
    const { count } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("course_id", c.id);
    const { data: enr } = await supabase.from("enrollments").select("amount_paid").eq("course_id", c.id);
    const revenue = (enr ?? []).reduce((s: number, e: any) => s + (Number(e.amount_paid) || 0), 0);
    return { ...c, enrollmentCount: count ?? 0, revenue };
  }));
  return {
    courses: coursesWithStats,
    stats: { totalCourses: courses?.length ?? 0, publishedCourses: coursesWithStats.filter((c: any) => c.is_published && c.is_approved).length, totalStudents: coursesWithStats.reduce((s: number, c: any) => s + c.enrollmentCount, 0), totalRevenue: coursesWithStats.reduce((s: number, c: any) => s + c.revenue, 0) },
  };
}

async function loadAdminDetails(supabase: any, userId: string) {
  const { data: approvedCourses } = await supabase.from("courses").select("id, title, approved_at").eq("approved_by", userId).order("approved_at", { ascending: false }).limit(10);
  const { data: invites } = await supabase.from("instructor_invites").select("*").eq("invited_by", userId).order("created_at", { ascending: false }).limit(10);
  return { approvedCourses: approvedCourses ?? [], invites: invites ?? [], stats: { coursesApproved: approvedCourses?.length ?? 0, instructorsInvited: invites?.length ?? 0 } };
}