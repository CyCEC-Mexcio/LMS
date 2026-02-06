import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: NextRequest) {
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

    const { mode } = await req.json(); // 'auto' or 'manual'

    // Get all instructors with pending earnings
    const { data: instructorsWithEarnings, error: instructorsError } = await supabase
      .from('transactions')
      .select(`
        instructor_id,
        instructor_earnings,
        id,
        course_id,
        created_at
      `)
      .eq('paid_out', false)
      .eq('status', 'completed');

    if (instructorsError) {
      throw instructorsError;
    }

    if (!instructorsWithEarnings || instructorsWithEarnings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending payouts to process',
        processedCount: 0,
      });
    }

    // Group transactions by instructor
    const instructorGroups = instructorsWithEarnings.reduce((acc, transaction) => {
      if (!acc[transaction.instructor_id]) {
        acc[transaction.instructor_id] = [];
      }
      acc[transaction.instructor_id].push(transaction);
      return acc;
    }, {} as Record<string, typeof instructorsWithEarnings>);

    const processedPayouts = [];
    const errors = [];

    // Process payout for each instructor
    for (const [instructorId, transactions] of Object.entries(instructorGroups)) {
      try {
        const totalAmount = transactions.reduce(
          (sum, t) => sum + Number(t.instructor_earnings),
          0
        );

        // Get instructor's payment preferences
        const { data: paymentPref } = await supabase
          .from('payment_preferences')
          .select('*')
          .eq('instructor_id', instructorId)
          .single();

        if (!paymentPref?.is_onboarded || !paymentPref.stripe_account_id) {
          console.log(`Instructor ${instructorId} not onboarded, skipping...`);
          errors.push({
            instructorId,
            error: 'Not onboarded',
          });
          continue;
        }

        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'mxn',
          destination: paymentPref.stripe_account_id,
          description: `Pago mensual - ${transactions.length} ventas`,
          metadata: {
            instructor_id: instructorId,
            transaction_count: transactions.length.toString(),
            payout_period: new Date().toISOString(),
          },
        });

        // Generate invoice number
        const { data: invoiceData } = await supabase.rpc('generate_invoice_number');
        const invoiceNumber = invoiceData || `INV-${Date.now()}`;

        // Calculate payout period (start of month to now)
        const periodStart = new Date();
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);

        // Create payout record
        const { data: payout, error: payoutError } = await supabase
          .from('payouts')
          .insert({
            instructor_id: instructorId,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: new Date().toISOString().split('T')[0],
            total_amount: totalAmount,
            transaction_count: transactions.length,
            payment_provider: 'stripe',
            transfer_id: transfer.id,
            status: 'completed',
            invoice_number: invoiceNumber,
            initiated_by: mode === 'manual' ? user.id : null,
            processed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (payoutError) {
          throw payoutError;
        }

        // Create payout items
        const payoutItems = transactions.map(t => ({
          payout_id: payout.id,
          transaction_id: t.id,
          amount: Number(t.instructor_earnings),
        }));

        await supabase.from('payout_items').insert(payoutItems);

        // Mark transactions as paid out
        const transactionIds = transactions.map(t => t.id);
        await supabase
          .from('transactions')
          .update({
            paid_out: true,
            payout_id: payout.id,
          })
          .in('id', transactionIds);

        processedPayouts.push({
          instructorId,
          amount: totalAmount,
          transactionCount: transactions.length,
          payoutId: payout.id,
          transferId: transfer.id,
        });

      } catch (error: any) {
        console.error(`Error processing payout for ${instructorId}:`, error);
        errors.push({
          instructorId,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: processedPayouts.length,
      payouts: processedPayouts,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Error processing payouts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payouts' },
      { status: 500 }
    );
  }
}