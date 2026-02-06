import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// POST /api/instructor/stripe-connect - Create Stripe Connect account and onboarding link
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can connect payment accounts' },
        { status: 403 }
      );
    }

    const { returnUrl, refreshUrl } = await req.json();

    // Check if instructor already has a Stripe account
    const { data: existingPreference } = await supabase
      .from('payment_preferences')
      .select('stripe_account_id, is_onboarded')
      .eq('instructor_id', user.id)
      .single();

    let accountId = existingPreference?.stripe_account_id;

    // Create new Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'MX',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          product_description: 'Online course instructor',
        },
        metadata: {
          instructor_id: user.id,
          instructor_name: profile.full_name || '',
        },
      });

      accountId = account.id;

      // Save to database
      await supabase
        .from('payment_preferences')
        .upsert({
          instructor_id: user.id,
          provider: 'stripe',
          stripe_account_id: accountId,
          is_onboarded: false,
        });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/teacher/payment-settings?refresh=true`,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/teacher/payment-settings?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: accountId,
    });

  } catch (error: any) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe Connect account' },
      { status: 500 }
    );
  }
}

// GET /api/instructor/stripe-connect - Check onboarding status
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get payment preferences
    const { data: preference } = await supabase
      .from('payment_preferences')
      .select('*')
      .eq('instructor_id', user.id)
      .single();

    if (!preference?.stripe_account_id) {
      return NextResponse.json({
        isOnboarded: false,
        hasAccount: false,
      });
    }

    // Check Stripe account status
    const account = await stripe.accounts.retrieve(preference.stripe_account_id);

    const isOnboarded = account.charges_enabled && account.payouts_enabled;

    // Update database if status changed
    if (isOnboarded && !preference.is_onboarded) {
      await supabase
        .from('payment_preferences')
        .update({
          is_onboarded: true,
          onboarded_at: new Date().toISOString(),
        })
        .eq('instructor_id', user.id);
    }

    return NextResponse.json({
      isOnboarded,
      hasAccount: true,
      accountId: preference.stripe_account_id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });

  } catch (error: any) {
    console.error('Stripe Connect status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}