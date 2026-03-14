import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Run queries in parallel
    const [
      pendingCoursesResult,
      unpaidTransactionsResult,
    ] = await Promise.all([
      // 1. Pending courses (not approved)
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false),

      // 2. Fetch all unpaid completed transactions to compute pending earnings
      supabase
        .from('transactions')
        .select('instructor_id, instructor_earnings')
        .eq('paid_out', false)
        .eq('status', 'completed'),
    ]);

    const pendingCoursesCount = pendingCoursesResult.count ?? 0;
    
    // Count instructors who have at least $1500 pending
    const instructorPendingTotals = new Map<string, number>();
    for (const tx of (unpaidTransactionsResult.data ?? [])) {
      if (!tx.instructor_id) continue;
      const current = instructorPendingTotals.get(tx.instructor_id) || 0;
      instructorPendingTotals.set(tx.instructor_id, current + Number(tx.instructor_earnings ?? 0));
    }

    let pendingPayoutsCount = 0;
    for (const total of instructorPendingTotals.values()) {
      if (total >= 1500) {
        pendingPayoutsCount++;
      }
    }

    // Calculate next payout date (1st or 15th of month)
    const today = new Date();
    const dayOfMonth = today.getDate();
    let nextPayoutDate: Date;
    if (dayOfMonth < 15) {
      nextPayoutDate = new Date(today.getFullYear(), today.getMonth(), 15);
    } else {
      nextPayoutDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }
    const daysUntilPayout = Math.max(0, Math.ceil(
      (nextPayoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    ));
    // Show payout reminder when within 3 days
    const payoutReminder = daysUntilPayout <= 3 ? 1 : 0;

    return NextResponse.json({
      pendingCoursesCount,
      pendingPayoutsCount,
      nextPayoutDate: nextPayoutDate.toISOString(),
      daysUntilPayout,
      totalNotifications: pendingCoursesCount + pendingPayoutsCount + payoutReminder
    });

  } catch (error: any) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin notifications' },
      { status: 500 }
    );
  }
}
