import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Use service role to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;

    // Verify the user is authenticated and is an admin or course owner
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check user role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Get the section to verify it exists and get course_id
    const { data: section, error: sectionError } = await supabaseAdmin
      .from("sections")
      .select("id, course_id")
      .eq("id", sectionId)
      .single();

    if (sectionError || !section) {
      return NextResponse.json(
        { error: "Capítulo no encontrado" },
        { status: 404 }
      );
    }

    // Verify the user is admin or owns the course
    if (profile?.role !== "admin") {
      const { data: course } = await supabaseAdmin
        .from("courses")
        .select("teacher_id")
        .eq("id", section.course_id)
        .single();

      if (course?.teacher_id !== user.id) {
        return NextResponse.json(
          { error: "No tienes permiso para eliminar este capítulo" },
          { status: 403 }
        );
      }
    }

    // First delete all lessons in this section
    const { error: lessonsDeleteError } = await supabaseAdmin
      .from("lessons")
      .delete()
      .eq("section_id", sectionId);

    if (lessonsDeleteError) {
      console.error("Error deleting lessons:", lessonsDeleteError);
      return NextResponse.json(
        { error: "Error al eliminar las lecciones del capítulo" },
        { status: 500 }
      );
    }

    // Then delete the section itself
    const { error: deleteError } = await supabaseAdmin
      .from("sections")
      .delete()
      .eq("id", sectionId);

    if (deleteError) {
      console.error("Error deleting section:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar el capítulo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error deleting section:", error);
    return NextResponse.json(
      { error: "Error inesperado al eliminar el capítulo" },
      { status: 500 }
    );
  }
}
