import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all transactions for this instructor
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        *,
        course:courses(title, thumbnail_url),
        student:profiles!transactions_student_id_fkey(full_name)
      `)
      .eq('instructor_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    // Calculate totals
    const totalEarnings = transactions?.reduce(
      (sum, t) => sum + Number(t.instructor_earnings),
      0
    ) || 0;

    const pendingEarnings = transactions
      ?.filter(t => !t.paid_out)
      .reduce((sum, t) => sum + Number(t.instructor_earnings), 0) || 0;

    const paidEarnings = transactions
      ?.filter(t => t.paid_out)
      .reduce((sum, t) => sum + Number(t.instructor_earnings), 0) || 0;

    // Get this month's stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthTransactions = transactions?.filter(
      t => new Date(t.created_at) >= monthStart
    ) || [];

    const thisMonthEarnings = thisMonthTransactions.reduce(
      (sum, t) => sum + Number(t.instructor_earnings),
      0
    );

    // Get payment preferences
    const { data: paymentPref } = await supabase
      .from('payment_preferences')
      .select('*')
      .eq('instructor_id', user.id)
      .single();

    // Get recent payouts
    const { data: recentPayouts } = await supabase
      .from('payouts')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate next payout date
    const nextPayoutDate = getNextPayoutDate();

    return NextResponse.json({
      totalEarnings,
      pendingEarnings,
      paidEarnings,
      totalSales: transactions?.length || 0,
      thisMonthSales: thisMonthTransactions.length,
      thisMonthEarnings,
      recentTransactions: transactions?.slice(0, 10) || [],
      recentPayouts: recentPayouts || [],
      nextPayoutDate: nextPayoutDate.toISOString(),
      paymentProvider: paymentPref?.provider || null,
      isOnboarded: paymentPref?.is_onboarded || false,
    });

  } catch (error: any) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}

function getNextPayoutDate(): Date {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  const dayOfWeek = nextMonth.getDay();
  let daysToAdd = 0;
  
  if (dayOfWeek === 0) {
    daysToAdd = 1;
  } else if (dayOfWeek !== 1) {
    daysToAdd = 8 - dayOfWeek;
  }
  
  nextMonth.setDate(nextMonth.getDate() + daysToAdd);
  return nextMonth;
}