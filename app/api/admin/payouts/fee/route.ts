import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { instructorId, platformFeePercent } = await req.json();

    if (!instructorId || typeof platformFeePercent !== 'number') {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (platformFeePercent < 0 || platformFeePercent > 100) {
      return new NextResponse("Invalid fee percentage", { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ platform_fee_percent: platformFeePercent })
      .eq("id", instructorId)
      .eq("role", "teacher");

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, platform_fee_percent: platformFeePercent });
  } catch (error) {
    console.error("[ADMIN_FEE_UPDATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
