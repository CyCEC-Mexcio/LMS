import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "teacher") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabase = await createClient();
    const { data: bankingInfo, error } = await supabase
      .from("teacher_banking_info")
      .select("*")
      .eq("teacher_id", profile.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[BANKING_INFO_GET_ERROR]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }

    return NextResponse.json(bankingInfo || null);
  } catch (error) {
    console.error("[BANKING_INFO_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "teacher") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { bank_name, account_number, clabe, business_name, rfc } = body;

    const supabase = await createClient();

    // Check if banking info already exists
    const { data: existingInfo } = await supabase
      .from("teacher_banking_info")
      .select("id")
      .eq("teacher_id", profile.id)
      .single();

    if (existingInfo) {
      // Update
      const { data: updatedInfo, error } = await supabase
        .from("teacher_banking_info")
        .update({
          bank_name,
          account_number,
          clabe,
          business_name,
          rfc,
          updated_at: new Date().toISOString(),
        })
        .eq("teacher_id", profile.id)
        .select()
        .single();

      if (error) {
        console.error("[BANKING_INFO_UPDATE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
      }

      return NextResponse.json(updatedInfo);
    } else {
      // Insert
      const { data: newInfo, error } = await supabase
        .from("teacher_banking_info")
        .insert({
          teacher_id: profile.id,
          bank_name,
          account_number,
          clabe,
          business_name,
          rfc,
        })
        .select()
        .single();

      if (error) {
        console.error("[BANKING_INFO_INSERT_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
      }

      return NextResponse.json(newInfo);
    }
  } catch (error) {
    console.error("[BANKING_INFO_POST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
