// app/api/admin/payouts/fee/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    if (!instructorId || typeof platformFeePercent !== "number") {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (platformFeePercent < 0 || platformFeePercent > 100) {
      return new NextResponse("Invalid fee percentage", { status: 400 });
    }

    // 1. Update the instructor's fee on their profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ platform_fee_percent: platformFeePercent })
      .eq("id", instructorId)
      .eq("role", "teacher");

    if (profileError) throw profileError;

    // 2. Recalculate all unpaid transactions for this instructor
    const newCommissionRate = platformFeePercent / 100;

    const { data: unpaidTxs, error: txFetchError } = await supabase
      .from("transactions")
      .select("id, total_amount")
      .eq("instructor_id", instructorId)
      .eq("paid_out", false)
      .eq("status", "completed");

    if (txFetchError) throw txFetchError;

    if (unpaidTxs && unpaidTxs.length > 0) {
      const updates = unpaidTxs.map((tx) => {
        const newPlatformFee = Number(tx.total_amount) * newCommissionRate;
        const newInstructorEarnings = Number(tx.total_amount) - newPlatformFee;

        return supabase
          .from("transactions")
          .update({
            platform_fee: newPlatformFee,
            instructor_earnings: newInstructorEarnings,
            commission_rate: newCommissionRate,
          })
          .eq("id", tx.id);
      });

      await Promise.all(updates);
    }

    return NextResponse.json({
      success: true,
      platform_fee_percent: platformFeePercent,
      transactions_recalculated: unpaidTxs?.length ?? 0,
    });
  } catch (error) {
    console.error("[ADMIN_FEE_UPDATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}