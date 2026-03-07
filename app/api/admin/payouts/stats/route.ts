// app/api/admin/payouts/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // ✅ cookieStore required — without it createClient crashes
    const supabase = await createClient();

    // Auth + admin check
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

    // ── Run all queries in parallel ──────────────────────────────────────

    const [
      pendingTransactionsResult,
      totalInstructorsResult,
      pendingEarningsResult,
      recentPayoutsResult,
      platformSummaryResult,
      nextPayoutDateResult,
    ] = await Promise.all([
      // 1. Total pending payout amount from transactions
      supabase
        .from('transactions')
        .select('instructor_earnings')
        .eq('paid_out', false)
        .eq('status', 'completed'),

      // 2. Total teacher count
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher'),

      // 3. Instructors with pending earnings — uses existing DB function
      supabase.rpc('get_instructors_with_pending_earnings'),

      // 4. Recent payouts (last 10)
      supabase
        .from('payouts')
        .select(`
          id,
          instructor_id,
          period_start,
          period_end,
          total_amount,
          transaction_count,
          payment_provider,
          status,
          invoice_number,
          processed_at,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10),

      // 5. Platform revenue summary — last 6 months
      supabase
        .from('platform_revenue_summary')
        .select('*')
        .order('month', { ascending: false })
        .limit(6),

      // 6. Next payout date from DB function
      supabase.rpc('get_next_payout_date'),
    ]);

    // ── Compute totals ───────────────────────────────────────────────────

    const totalPendingPayouts =
      pendingTransactionsResult.data?.reduce(
        (sum, t) => sum + Number(t.instructor_earnings),
        0
      ) ?? 0;

    const totalInstructors = totalInstructorsResult.count ?? 0;

    const instructorsWithPendingEarnings =
      (pendingEarningsResult.data ?? []) as {
        instructor_id: string;
        instructor_name: string;
        pending_earnings: number;
        total_sales: number;
        total_earned: number;
        paid_earnings: number;
      }[];

    // Normalise field names — the RPC returns pending_earnings but the
    // payouts page expects pending_amount + transaction_count
    const normalisedPendingEarnings = instructorsWithPendingEarnings.map((i) => ({
      instructor_id:    i.instructor_id,
      instructor_name:  i.instructor_name,
      pending_amount:   Number(i.pending_earnings ?? 0),
      total_earned:     Number(i.total_earned ?? 0),
      paid_earnings:    Number(i.paid_earnings ?? 0),
      transaction_count: Number(i.total_sales ?? 0),
    }));

    // Platform revenue — reverse so chart goes oldest→newest
    const platformRevenue = (platformSummaryResult.data ?? []).reverse();

    // Total platform revenue all-time (sum of platform_earnings column)
    const totalPlatformRevenue = platformRevenue.reduce(
      (sum, r) => sum + Number(r.platform_earnings ?? 0),
      0
    );

    // Next payout date — RPC returns a date string or use fallback
    const nextPayoutDate =
      nextPayoutDateResult.data ?? getFallbackNextPayoutDate();

    return NextResponse.json({
      // Summary numbers (used by stat cards)
      totalPendingPayouts,
      totalInstructors,
      nextPayoutDate,
      totalPlatformRevenue,

      // Table data
      instructorsWithPendingEarnings: normalisedPendingEarnings,
      recentPayouts:                  recentPayoutsResult.data ?? [],
      platformRevenueSummary:         platformRevenue,
    });

  } catch (error: any) {
    console.error('Error fetching payout stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout stats' },
      { status: 500 }
    );
  }
}

// Fallback if the DB function isn't available
function getFallbackNextPayoutDate(): string {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const day = nextMonth.getDay(); // 0=Sun 1=Mon
  const daysToAdd = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  nextMonth.setDate(nextMonth.getDate() + daysToAdd);
  return nextMonth.toISOString();
}