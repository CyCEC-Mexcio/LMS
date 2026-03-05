// app/api/instructor/stripe-connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

// POST /api/instructor/stripe-connect
export async function POST(req: NextRequest) {
  try {
    // ✅ FIX: pass cookieStore — calling createClient() without it crashes
    // with "Cannot read properties of undefined (reading 'getAll')"
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { data: existingPreference } = await supabase
      .from('payment_preferences')
      .select('stripe_account_id, is_onboarded')
      .eq('instructor_id', user.id)
      .maybeSingle();

    let accountId = existingPreference?.stripe_account_id;

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

      await supabase
        .from('payment_preferences')
        .upsert({
          instructor_id: user.id,
          provider: 'stripe',
          stripe_account_id: accountId,
          is_onboarded: false,
        });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/teacher/payment-settings?refresh=true`,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/teacher/payment-settings?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId,
    });

  } catch (error: any) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe Connect account' },
      { status: 500 }
    );
  }
}

// GET /api/instructor/stripe-connect
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: preference } = await supabase
      .from('payment_preferences')
      .select('*')
      .eq('instructor_id', user.id)
      .maybeSingle();

    if (!preference?.stripe_account_id) {
      return NextResponse.json({ isOnboarded: false, hasAccount: false });
    }

    const account = await stripe.accounts.retrieve(preference.stripe_account_id);
    const isOnboarded = account.charges_enabled && account.payouts_enabled;

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
    console.error('Stripe Connect status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}