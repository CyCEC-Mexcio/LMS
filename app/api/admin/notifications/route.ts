// app/api/admin/notifications/route.ts
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

    const [
      pendingCoursesResult,
      unpaidTransactionsResult,
      teacherIdsResult,
    ] = await Promise.all([
      // 1. Pending courses awaiting approval
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false),

      // 2. Unpaid completed transactions
      supabase
        .from('transactions')
        .select('instructor_id, instructor_earnings')
        .eq('paid_out', false)
        .eq('status', 'completed'),

      // 3. All teacher IDs (role = 'teacher' only — excludes admins)
      supabase
        .from('profiles')
        .select('id')
        .eq('role', 'teacher'),
    ]);

    const pendingCoursesCount = pendingCoursesResult.count ?? 0;

    // Build a set of valid teacher IDs so admin transactions are ignored
    const teacherIds = new Set((teacherIdsResult.data ?? []).map((p) => p.id));

    // Count teachers with >= $1500 pending (admins excluded)
    const instructorPendingTotals = new Map<string, number>();
    for (const tx of (unpaidTransactionsResult.data ?? [])) {
      if (!tx.instructor_id) continue;
      if (!teacherIds.has(tx.instructor_id)) continue; // skip admin-owned transactions

      const current = instructorPendingTotals.get(tx.instructor_id) ?? 0;
      instructorPendingTotals.set(tx.instructor_id, current + Number(tx.instructor_earnings ?? 0));
    }

    let pendingPayoutsCount = 0;
    for (const total of instructorPendingTotals.values()) {
      if (total >= 1500) pendingPayoutsCount++;
    }

    // Next payout date (1st or 15th of month)
    const today = new Date();
    const dayOfMonth = today.getDate();
    let nextPayoutDate: Date;
    if (dayOfMonth < 15) {
      nextPayoutDate = new Date(today.getFullYear(), today.getMonth(), 15);
    } else {
      nextPayoutDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }
    const daysUntilPayout = Math.max(
      0,
      Math.ceil((nextPayoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
    const payoutReminder = daysUntilPayout <= 3 ? 1 : 0;

    return NextResponse.json({
      pendingCoursesCount,
      pendingPayoutsCount,
      nextPayoutDate: nextPayoutDate.toISOString(),
      daysUntilPayout,
      totalNotifications: pendingCoursesCount + pendingPayoutsCount + payoutReminder,
    });

  } catch (error: any) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin notifications' },
      { status: 500 }
    );
  }
}