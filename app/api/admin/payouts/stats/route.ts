// app/api/admin/payouts/stats/route.ts
export const dynamic = 'force-dynamic';

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
      allTransactionsResult,
      totalInstructorsResult,
      recentPayoutsResult,
      teacherInfosResult,
    ] = await Promise.all([
      // 1. Fetch ALL completed transactions to compute both pending earnings AND platform revenue
      supabase
        .from('transactions')
        .select(`
          id,
          instructor_id,
          instructor_earnings,
          platform_fee,
          total_amount,
          paid_out,
          status,
          created_at
        `)
        .eq('status', 'completed'),

      // 2. Total teacher count
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher'),

      // 3. Recent payouts (last 10)
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

      // 4. Fetch all teacher info (profiles + banking info) so we can build the instructor array
      supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          platform_fee_percent,
          role,
          teacher_banking_info (
            bank_name,
            account_number,
            clabe,
            business_name,
            rfc
          )
        `)
        .eq('role', 'teacher'),
    ]);

    const allTransactions = allTransactionsResult.data ?? [];
    const teacherProfiles = teacherInfosResult.data ?? [];

    // ── Compute Instructor Earnings ──────────────────────────────────────

    // Map: instructor_id -> stats
    const instructorStats = new Map<string, any>();

    // Initialize map with all teachers
    for (const teacher of teacherProfiles) {
      const banking = Array.isArray(teacher.teacher_banking_info)
        ? teacher.teacher_banking_info[0]
        : teacher.teacher_banking_info;

      instructorStats.set(teacher.id, {
        instructor_id: teacher.id,
        instructor_name: teacher.full_name ?? 'Instructor Anónimo',
        pending_amount: 0,
        total_earned: 0,
        paid_earnings: 0,
        transaction_count: 0,
        platform_fee_percent: Number(teacher.platform_fee_percent ?? 15),
        bank_name: banking?.bank_name ?? null,
        account_number: banking?.account_number ?? null,
        clabe: banking?.clabe ?? null,
        business_name: banking?.business_name ?? null,
        rfc: banking?.rfc ?? null,
      });
    }

    let totalPendingPayouts = 0;

    // Process all transactions for instructor earnings
    for (const tx of allTransactions) {
      const isPaid = tx.paid_out === true;
      const earnings = Number(tx.instructor_earnings ?? 0);
      const instructorId = tx.instructor_id;

      if (!instructorStats.has(instructorId)) continue; // skip non-teachers or orphaned txs

      const stats = instructorStats.get(instructorId);
      
      // Update totals
      stats.total_earned += earnings;
      stats.transaction_count += 1;

      if (isPaid) {
        stats.paid_earnings += earnings;
      } else {
        stats.pending_amount += earnings;
        totalPendingPayouts += earnings;
      }
    }

    // Filter to only those with pending amounts > 0 (or adjust to show all if preferred, but existing UI filters pending > 0 for this specific table list)
    const normalisedPendingEarnings = Array.from(instructorStats.values())
      .filter(s => s.pending_amount > 0)
      .sort((a, b) => b.pending_amount - a.pending_amount);


    // ── Compute Platform Revenue Summary (last 6 months) ──────────────────

    // Group transactions by YYYY-MM
    const monthlyStats = new Map<string, {
      month: string;
      total_transactions: number;
      total_revenue: number;
      platform_earnings: number;
      instructor_earnings: number;
    }>();

    for (const tx of allTransactions) {
      if (!tx.created_at) continue;
      const d = new Date(tx.created_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

      if (!monthlyStats.has(monthKey)) {
        monthlyStats.set(monthKey, {
          month: monthKey,
          total_transactions: 0,
          total_revenue: 0,
          platform_earnings: 0,
          instructor_earnings: 0,
        });
      }

      const m = monthlyStats.get(monthKey)!;
      m.total_transactions += 1;
      m.total_revenue += Number(tx.total_amount ?? 0);
      m.platform_earnings += Number(tx.platform_fee ?? 0);
      m.instructor_earnings += Number(tx.instructor_earnings ?? 0);
    }

    // Sort months DESC and take last 6, then reverse for chart
    let platformRevenue = Array.from(monthlyStats.values())
      .sort((a, b) => b.month.localeCompare(a.month)) // newest first
      .slice(0, 6)
      .reverse(); // oldest to newest for chart

    // Total platform revenue all-time
    const totalPlatformRevenue = Array.from(monthlyStats.values()).reduce(
      (sum, r) => sum + r.platform_earnings,
      0
    );

    const totalInstructors = totalInstructorsResult.count ?? 0;
    const nextPayoutDate = getFallbackNextPayoutDate();

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

// 15-day payout cycle: payouts on the 1st and 15th of each month
function getFallbackNextPayoutDate(): string {
  const today = new Date();
  const dayOfMonth = today.getDate();
  let next: Date;
  if (dayOfMonth < 15) {
    // Next payout is the 15th of this month
    next = new Date(today.getFullYear(), today.getMonth(), 15);
  } else {
    // Next payout is the 1st of next month
    next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  }
  return next.toISOString();
}