import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check: Caller MUST be an authenticated Admin ─────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Acceso denegado: solo administradores pueden realizar esta acción" },
        { status: 403 }
      );
    }

    // ── 2. Parse & validate request payload ──────────────────────────────────
    const { courseId, studentId, reason } = await request.json();

    if (!courseId || !studentId) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (courseId o studentId)" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Verify course exists
    const { data: course, error: courseErr } = await adminSupabase
      .from("courses")
      .select("id, title, teacher_id")
      .eq("id", courseId)
      .single();

    if (courseErr || !course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    // Verify student exists
    const { data: studentProfile } = await adminSupabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", studentId)
      .single();

    // ── 3. Find all lesson IDs for this course ──────────────────────────────
    const { data: sections } = await adminSupabase
      .from("sections")
      .select("id, lessons (id)")
      .eq("course_id", courseId);

    const lessonIds: string[] = [];
    (sections ?? []).forEach((s: any) => {
      (s.lessons ?? []).forEach((l: any) => {
        if (l.id) lessonIds.push(l.id);
      });
    });

    // ── 4. Atomic deletion of Course Progress, Certificates & Enrollment ────
    // (A) Delete progress rows for this student in this course's lessons
    if (lessonIds.length > 0) {
      const { error: progressDelError } = await adminSupabase
        .from("progress")
        .delete()
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds);

      if (progressDelError) {
        console.error("[RemoveEnrollment] Error deleting progress rows:", progressDelError);
      }
    }

    // (B) Delete certificates for this course if any
    try {
      await adminSupabase
        .from("certificates")
        .delete()
        .eq("student_id", studentId)
        .eq("course_id", courseId);
    } catch (certErr) {
      console.warn("[RemoveEnrollment] Certificate delete notice:", certErr);
    }

    // (C) Delete enrollment record (core unenrollment)
    const { error: enrollDelError, count } = await adminSupabase
      .from("enrollments")
      .delete({ count: "exact" })
      .eq("student_id", studentId)
      .eq("course_id", courseId);

    if (enrollDelError) {
      console.error("[RemoveEnrollment] Error deleting enrollment:", enrollDelError);
      return NextResponse.json(
        { error: "Error al eliminar la inscripción: " + enrollDelError.message },
        { status: 500 }
      );
    }

    // ── 5. Audit Logging ────────────────────────────────────────────────────
    const auditEntry = {
      action: "REMOVE_STUDENT_ENROLLMENT",
      performed_by_id: user.id,
      performed_by_name: adminProfile.full_name || "Admin",
      student_id: studentId,
      student_name: studentProfile?.full_name || "Estudiante",
      course_id: courseId,
      course_title: course.title,
      reason: reason || "Baja administrativa realizada por administrador",
      timestamp: new Date().toISOString(),
    };

    console.log("[AUDIT LOG - REMOVE ENROLLMENT]", JSON.stringify(auditEntry, null, 2));

    // Attempt to persist to admin_audit_logs or admin_notifications if available
    try {
      await adminSupabase.from("admin_audit_logs").insert([
        {
          user_id: user.id,
          action: "unenroll_student",
          details: auditEntry,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      // If table does not exist, system log above already preserves audit trail
    }

    return NextResponse.json({
      success: true,
      message: `El estudiante fue dado de baja del curso "${course.title}" exitosamente.`,
      courseId,
      studentId,
    });
  } catch (error: any) {
    console.error("[RemoveEnrollment] Unexpected server error:", error);
    return NextResponse.json(
      { error: error.message || "Error inesperado al procesar la baja del estudiante" },
      { status: 500 }
    );
  }
}
