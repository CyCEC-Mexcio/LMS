import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ status: "not_found" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("student_invites")
      .select("id, email, full_name, accepted, accepted_at, expires_at, courses(id, title, slug, instructor_name, price)")
      .eq("invite_token", token)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ status: "not_found" });
    }

    if (data.accepted) {
      return NextResponse.json({
        status: "already_used",
        email: data.email,
        acceptedAt: data.accepted_at,
      });
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({
        status: "expired",
        email: data.email,
        expiresAt: data.expires_at,
      });
    }

    return NextResponse.json({
      status: "valid",
      invite: data,
    });
  } catch (err: any) {
    console.error("Error checking invite status:", err);
    return NextResponse.json(
      { status: "error", message: err.message || "Error al verificar invitación" },
      { status: 500 }
    );
  }
}
