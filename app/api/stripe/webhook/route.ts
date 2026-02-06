import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create Supabase service role client (bypasses RLS)
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// Disable body parsing so we can verify the webhook signature
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('🔔 Webhook received');

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.log('❌ No signature provided');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.log(`❌ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Webhook verified:', event.type);

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('💳 Processing payment for session:', session.id);

      // Get metadata from session
      const {
        courseId,
        studentId,
        instructorId,
        totalAmount,
        platformFee,
        instructorEarnings,
        commissionRate,
      } = session.metadata || {};

      if (!courseId || !studentId || !instructorId) {
        console.log('❌ Missing required metadata');
        return NextResponse.json(
          { error: 'Missing required metadata' },
          { status: 400 }
        );
      }

      // Use service role client to bypass RLS
      const supabase = getServiceClient();

      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .single();

      if (existingEnrollment) {
        console.log('ℹ️ Enrollment already exists');
        return NextResponse.json({ received: true });
      }

      // Create enrollment
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          payment_method: 'stripe',
          payment_id: session.payment_intent as string,
          amount_paid: parseFloat(totalAmount || '0'),
        })
        .select()
        .single();

      if (enrollError) {
        console.error('❌ Failed to create enrollment:', enrollError);
        throw enrollError;
      }

      console.log('✅ Enrollment created:', enrollment.id);

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          enrollment_id: enrollment.id,
          course_id: courseId,
          instructor_id: instructorId,
          student_id: studentId,
          payment_provider: 'stripe',
          payment_intent_id: session.payment_intent as string,
          total_amount: parseFloat(totalAmount || '0'),
          platform_fee: parseFloat(platformFee || '0'),
          instructor_earnings: parseFloat(instructorEarnings || '0'),
          commission_rate: parseFloat(commissionRate || '0.15'),
          status: 'completed',
          paid_out: false,
        })
        .select()
        .single();

      if (transactionError) {
        console.error('❌ Failed to create transaction:', transactionError);
        throw transactionError;
      }

      console.log('✅ Transaction created:', transaction.id);
      console.log('🎉 Payment processing complete!');
    }

    // Handle payment intent succeeded (backup)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('💰 Payment intent succeeded:', paymentIntent.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}