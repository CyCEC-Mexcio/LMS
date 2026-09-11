import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

// POST /api/stripe/checkout - Create Stripe checkout session for course purchase
export async function POST(req: NextRequest) {
  console.log('🛒 Checkout request received');
  
  try {
    // Create Supabase client for API routes (Next.js 15)
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ User not authenticated');
      return NextResponse.json(
        { error: 'You must be logged in to purchase a course' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    const { courseId } = await req.json();

    if (!courseId) {
      console.log('❌ No course ID provided');
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    console.log('📚 Fetching course:', courseId);

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        price,
        currency,
        teacher_id,
        thumbnail_url,
        is_published,
        is_approved
      `)
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.log('❌ Course not found');
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    console.log('✅ Course found:', course.title);

    // Check if course is published and approved
    if (!course.is_published || !course.is_approved) {
      console.log('❌ Course not available');
      return NextResponse.json(
        { error: 'This course is not available for purchase' },
        { status: 400 }
      );
    }

    // Check if student already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      console.log('⚠️ User already enrolled');
      return NextResponse.json(
        { error: 'You are already enrolled in this course' },
        { status: 400 }
      );
    }

    // Check if course is free
    if (course.price === 0 || course.price === null) {
      console.log('🎁 Creating free enrollment');
      
      // Create free enrollment directly
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          payment_method: 'free',
          amount_paid: 0,
        })
        .select()
        .single();

      if (enrollError) {
        console.error('❌ Failed to create enrollment:', enrollError);
        throw enrollError;
      }

      console.log('✅ Free enrollment created');
      return NextResponse.json({
        success: true,
        free: true,
        enrollmentId: enrollment.id,
      });
    }

    console.log('💳 Creating Stripe checkout session');

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (customerId) {
      try {
        const existingCust = await stripe.customers.retrieve(customerId);
        if ((existingCust as any).deleted) {
          customerId = null;
        }
      } catch {
        // Customer was created in test mode or another account, regenerate for current mode
        customerId = null;
      }
    }

    if (!customerId) {
      console.log('👤 Creating new Stripe customer');
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.full_name || undefined,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      
      console.log('✅ Stripe customer created:', customerId);
    }

    // Look up instructor's profile for role + custom commission rate
    const { data: instructorProfile } = await supabase
      .from('profiles')
      .select('role, platform_fee_percent')
      .eq('id', course.teacher_id)
      .single();

    const totalAmount = Number(course.price);
    const isAdminCourse = instructorProfile?.role === 'admin';

    // Admin-created courses → 100% platform revenue; otherwise use instructor's custom fee
    const commissionRate = isAdminCourse
      ? 1.0
      : (instructorProfile?.platform_fee_percent ?? 15) / 100;
    const platformFee = Math.round(totalAmount * commissionRate * 100) / 100;
    const instructorEarnings = totalAmount - platformFee;

    console.log('💰 Amount:', totalAmount, course.currency);

    // Determine the base URL dynamically from request headers, falling back to NEXT_PUBLIC_SITE_URL
    const originHeader = req.headers.get('origin');
    const refererHeader = req.headers.get('referer');
    let refererOrigin: string | null = null;
    if (refererHeader) {
      try {
        refererOrigin = new URL(refererHeader).origin;
      } catch {
        // ignore invalid referer URL
      }
    }
    const hostHeader = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const protoHeader = req.headers.get('x-forwarded-proto') || 'https';
    const hostOrigin = hostHeader ? `${protoHeader}://${hostHeader}` : null;

    const siteUrl = originHeader || refererOrigin || hostOrigin || process.env.NEXT_PUBLIC_SITE_URL || 'https://cycecmexico.com';

    console.log('🔍 [DIAGNOSTIC: checkout_creation]', {
      userId: user.id,
      userEmail: user.email,
      courseId,
      originHeader,
      refererHeader,
      hostHeader,
      resolvedSiteUrl: siteUrl,
      cookieNames: req.cookies.getAll().map((c) => c.name),
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: course.currency?.toLowerCase() || 'mxn',
            product_data: {
              name: course.title,
              description: `Acceso completo al curso: ${course.title}`,
              images: course.thumbnail_url ? [course.thumbnail_url] : undefined,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/student/courses/${courseId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/browse/test?canceled=true`,
      metadata: {
        courseId: courseId,
        studentId: user.id,
        instructorId: course.teacher_id,
        totalAmount: totalAmount.toString(),
        platformFee: platformFee.toString(),
        instructorEarnings: instructorEarnings.toString(),
        commissionRate: commissionRate.toString(),
      },
      payment_intent_data: {
        metadata: {
          courseId: courseId,
          studentId: user.id,
          instructorId: course.teacher_id,
        },
      },
    });

    console.log('✅ Checkout session created:', {
      sessionId: session.id,
      sessionUrl: session.url,
      success_url: `${siteUrl}/student/courses/${courseId}?success=true`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}