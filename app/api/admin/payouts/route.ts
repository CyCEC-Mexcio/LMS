// app/api/admin/payouts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Pending transactions total
    const { data: pendingTransactions } = await supabase
      .from('transactions')
      .select('instructor_earnings')
      .eq('paid_out', false)
      .eq('status', 'completed');

    const totalPendingPayouts = pendingTransactions?.reduce(
      (sum, t) => sum + Number(t.instructor_earnings), 0
    ) ?? 0;

    const { count: totalInstructors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    const { data: instructorEarnings } = await supabase.rpc(
      'get_instructors_with_pending_earnings'
    );

    const { data: nextPayoutDate } = await supabase.rpc('get_next_payout_date');

    return NextResponse.json({
      totalPendingPayouts,
      totalInstructors: totalInstructors ?? 0,
      nextPayoutDate,
      instructorsWithPendingEarnings: (instructorEarnings ?? []).map((i: any) => ({
        instructor_id:     i.instructor_id,
        instructor_name:   i.instructor_name,
        pending_amount:    Number(i.pending_earnings ?? 0),
        transaction_count: Number(i.total_sales ?? 0),
      })),
    });

  } catch (error: any) {
    console.error('Error fetching payout stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout stats' },
      { status: 500 }
    );
  }
}