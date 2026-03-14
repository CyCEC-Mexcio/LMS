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
      pendingEarningsResult,
    ] = await Promise.all([
      // 1. Pending courses (not approved)
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false),

      // 2. Instructors with pending earnings
      supabase.rpc('get_instructors_with_pending_earnings'),
    ]);

    const pendingCoursesCount = pendingCoursesResult.count ?? 0;
    
    // Count instructors who have at least $1500 pending
    const instructorsWithPendingEarnings = pendingEarningsResult.data ?? [];
    const pendingPayoutsCount = instructorsWithPendingEarnings.filter(
      (i: any) => Number(i.pending_earnings ?? 0) >= 1500
    ).length;

    return NextResponse.json({
      pendingCoursesCount,
      pendingPayoutsCount,
      totalNotifications: pendingCoursesCount + pendingPayoutsCount
    });

  } catch (error: any) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin notifications' },
      { status: 500 }
    );
  }
}
