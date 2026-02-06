// lib/stripe.ts
import Stripe from "stripe";

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

/**
 * Create a Stripe Checkout Session for course purchase
 */
export async function createCheckoutSession({
  courseId,
  courseTitle,
  price,
  currency = "MXN",
  studentId,
  studentEmail,
}: {
  courseId: string;
  courseTitle: string;
  price: number;
  currency?: string;
  studentId: string;
  studentEmail: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: courseTitle,
            description: `Acceso completo al curso: ${courseTitle}`,
          },
          unit_amount: Math.round(price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    customer_email: studentEmail,
    metadata: {
      courseId,
      studentId,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/courses/${courseId}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/browse/${courseId}?payment=cancelled`,
  });

  return session;
}

/**
 * Create or retrieve a Stripe Connect account for an instructor
 */
export async function createConnectAccount(instructorId: string, email: string) {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      instructorId,
    },
  });

  return account;
}

/**
 * Create an account link for instructor onboarding
 */
export async function createAccountLink(accountId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/teacher/earnings?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/teacher/earnings?setup=complete`,
    type: "account_onboarding",
  });

  return accountLink;
}

/**
 * Transfer payment to instructor (minus platform fee)
 */
export async function transferToInstructor({
  amount,
  instructorStripeAccountId,
  courseId,
}: {
  amount: number;
  instructorStripeAccountId: string;
  courseId: string;
}) {
  // Calculate platform fee (e.g., 10%)
  const platformFeePercentage = 0.1;
  const platformFee = Math.round(amount * platformFeePercentage);
  const instructorAmount = amount - platformFee;

  const transfer = await stripe.transfers.create({
    amount: instructorAmount,
    currency: "mxn",
    destination: instructorStripeAccountId,
    metadata: {
      courseId,
    },
  });

  return { transfer, platformFee, instructorAmount };
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(body: string, signature: string) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}