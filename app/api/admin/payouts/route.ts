import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
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

    // Get total pending payouts amount
    const { data: pendingTransactions } = await supabase
      .from('transactions')
      .select('instructor_earnings')
      .eq('paid_out', false)
      .eq('status', 'completed');

    const totalPendingPayouts = pendingTransactions?.reduce(
      (sum, t) => sum + Number(t.instructor_earnings),
      0
    ) || 0;

    // Get total number of instructors
    const { count: totalInstructors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    // Get instructors with pending earnings
    const { data: instructorEarnings } = await supabase.rpc(
      'get_instructors_with_pending_earnings'
    );

    // Calculate next payout date (1st Monday of next month)
    const nextPayoutDate = getNextPayoutDate();

    return NextResponse.json({
      totalPendingPayouts,
      totalInstructors: totalInstructors || 0,
      nextPayoutDate: nextPayoutDate.toISOString(),
      instructorsWithPendingEarnings: instructorEarnings || [],
    });

  } catch (error: any) {
    console.error('Error fetching payout stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout stats' },
      { status: 500 }
    );
  }
}

function getNextPayoutDate(): Date {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  // Find first Monday
  const dayOfWeek = nextMonth.getDay();
  let daysToAdd = 0;
  
  if (dayOfWeek === 0) {
    // Sunday
    daysToAdd = 1;
  } else if (dayOfWeek !== 1) {
    // Not Monday
    daysToAdd = 8 - dayOfWeek;
  }
  
  nextMonth.setDate(nextMonth.getDate() + daysToAdd);
  return nextMonth;
}