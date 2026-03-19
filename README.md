# CyCEC LMS
### Learning Management System — Technical Documentation & Maintenance Guide

---

## 1. Project Overview

CyCEC LMS is a full-stack Learning Management System built with Next.js and TypeScript. It supports three distinct user roles — Students, Teachers, and Admins — and provides a complete workflow for creating, publishing, purchasing, and completing online courses.

The platform integrates video hosting (Mux), payment processing (Stripe + PayPal), email delivery (Resend), and a Supabase backend, making it a production-ready educational platform.

---

## 2. Tech Stack & Tools

### 2.1 Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | React framework with App Router & Turbopack |
| TypeScript | 5 | Type-safe development across the entire codebase |
| React | Latest | UI rendering and state management |
| Tailwind CSS | Latest | Utility-first styling |
| Radix UI | Latest | Accessible headless UI components (Dialog, Accordion, etc.) |

### 2.2 Backend & Database

| Service | Package | Purpose |
|---------|---------|---------|
| Supabase | @supabase/supabase-js, @supabase/ssr | PostgreSQL database, auth, real-time, storage |
| Mux | API via route handlers | Video upload, processing, and streaming |
| Stripe | stripe | Payment processing and instructor payouts (Connect) |
| PayPal | paypal.ts (lib) | Alternative payment gateway |
| Resend | resend | Transactional email (instructor invites, notifications) |

### 2.3 Forms & Validation

| Library | Purpose |
|---------|---------|
| React Hook Form | Form state management across all editors and creators |
| Zod | Schema validation for API inputs and form data |
| react-resizable-panels | Resizable layout panels in the course editor |

---

## 3. Project Structure

### 3.1 App Directory (Route Groups)

| Route Group | Path | Description |
|-------------|------|-------------|
| (auth) | /login, /signup | Authentication pages — login and signup flows |
| (marketing) | /courses, /nosotros, /contacto, /aviso-privacidad, /terminos-condiciones | Public-facing marketing pages |
| (platform) /admin | /admin/** | Admin dashboard — user mgmt, course approval, payouts, settings |
| (platform) /teacher | /teacher/** | Teacher dashboard — course creation, analytics, earnings, payment settings |
| (platform) /student | /student/** | Student dashboard — enrolled courses, progress, certificates |
| (platform) /browse | /browse/** | Course catalog and individual course detail pages |
| api/ | /api/** | All backend route handlers (Stripe, Mux, certificates, etc.) |
| invite/ | /invite/instructor | Instructor invitation acceptance page |
| auth/callback | /auth/callback | Supabase OAuth callback handler |

### 3.2 Key Directories

```
├── app/            # Next.js App Router pages, layouts, and API routes
├── components/     # Reusable React components (course, admin, teacher, student, UI, layouts)
├── lib/            # Shared utilities: Supabase client, Stripe, PayPal, auth helpers, email templates
├── public/         # Static files (images, icons, OG image)
├── .env.local      # Environment variables (never commit this)
├── next.config.ts  # Next.js config (image optimization, Turbopack)
└── package.json    # Dependencies and scripts
```

### 3.3 API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/stripe/checkout | POST | Create Stripe checkout session for course purchase |
| /api/stripe/webhook | POST | Handle Stripe events (payment confirmed, etc.) |
| /api/mux/create-upload | POST | Generate Mux upload URL for video lessons |
| /api/mux/check-upload | GET | Poll Mux upload/processing status |
| /api/certificates | GET/POST | Generate and list student certificates |
| /api/certificates/[id]/download | GET | Download a specific certificate PDF |
| /api/instructor/stripe-connect | POST | Initiate Stripe Connect onboarding for teachers |
| /api/instructor/earnings | GET | Fetch teacher earnings data |
| /api/instructor/banking-info | GET/POST | Manage teacher banking details |
| /api/admin/payouts | GET/POST | Admin payout management |
| /api/admin/payouts/process | POST | Process pending payouts to instructors |
| /api/admin/users/[userId] | GET/PATCH/DELETE | Admin user management |
| /api/admin/invite-instructor | POST | Send instructor invitation via Resend email |
| /api/admin/notifications | GET | Fetch admin notifications |
| /api/lessons/[lessonId]/complete | POST | Mark a lesson as completed for a student |

---

## 4. Installation & Local Setup

### Step 1 — Clone the repository
```bash
git clone https://github.com/your-username/cycec-lms.git
cd cycec-lms
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Configure environment variables

Create a `.env.local` file in the project root:

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Your Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Supabase anonymous/public key |
| SUPABASE_SERVICE_ROLE_KEY | Yes | Supabase service role key (server-side only) |
| STRIPE_SECRET_KEY | Yes | Stripe secret key (sk_live_... or sk_test_...) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Yes | Stripe publishable key |
| STRIPE_WEBHOOK_SECRET | Yes | Stripe webhook signing secret |
| MUX_TOKEN_ID | Yes | Mux API token ID |
| MUX_TOKEN_SECRET | Yes | Mux API token secret |
| RESEND_API_KEY | Yes | Resend API key for transactional email |
| PAYPAL_CLIENT_ID | Optional | PayPal app client ID |
| PAYPAL_CLIENT_SECRET | Optional | PayPal app client secret |
| NEXT_PUBLIC_APP_URL | Yes | Base URL (e.g. http://localhost:3000) |

### Step 4 — Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses Turbopack for fast hot-module replacement.

---

## 5. User Roles & Permissions

| Role | Access | Key Capabilities |
|------|--------|-----------------|
| Student | /student/**, /browse/** | Browse & purchase courses, watch lessons, track progress, earn certificates |
| Teacher | /teacher/** | Create & publish courses, manage chapters/lessons, upload videos, view analytics & earnings |
| Admin | /admin/** | Approve courses, manage all users, process payouts, invite instructors, platform settings |

---

## 6. Core Features

### 6.1 Course Lifecycle
1. Teachers create courses with chapters and lessons (video + content + quiz + resources)
2. Teachers set pricing and submit for approval
3. Admin reviews and approves or rejects submissions
4. Approved courses appear in the public browse catalog
5. Students purchase courses via Stripe or PayPal checkout
6. Stripe webhook confirms payment and enrolls the student

### 6.2 Video Lessons (Mux)
- Teachers upload videos via the lesson editor
- Videos are sent to Mux for processing and adaptive streaming
- Mux upload status is polled via `/api/mux/check-upload`
- Processed videos are served securely via the `VideoPlayer` component

### 6.3 Certificates
- Automatically generated when a student completes all lessons in a course
- Downloadable as PDF via `/api/certificates/[id]/download`
- Viewable in the student certificate dashboard

### 6.4 Payouts
- Teachers connect bank accounts via Stripe Connect onboarding
- Admins view payout stats and process pending instructor payouts
- Platform fee is configurable via `/api/admin/payouts/fee`

---

## 7. Maintenance Guide

### 7.1 Dependency Updates

Run periodically (monthly recommended):

```bash
npm outdated                    # Check which packages have updates
npm update                      # Apply safe minor/patch updates
npx npm-check-updates -u        # Upgrade all to latest (review before committing)
npm install
npm run build                   # Always verify build passes after updates
```

### 7.2 Supabase Database
- Use **Supabase Studio** (app.supabase.com) to manage tables, RLS policies, and run queries
- For schema changes, write migrations using the Supabase CLI: `supabase migration new <name>`
- Always test migrations on a staging/preview project before applying to production
- Regularly review **Row Level Security (RLS)** policies to ensure proper data access control
- Monitor the dashboard for slow queries, database size, and API usage

### 7.3 Stripe
- Rotate API keys in the Stripe dashboard if compromised — update `.env.local` immediately
- Re-register the webhook endpoint if the app URL changes (`/api/stripe/webhook`)
- Test webhooks locally using the Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
- Check Stripe Connect dashboard for any instructor payout failures

### 7.4 Mux
- Monitor the Mux dashboard for failed video uploads or processing errors
- Delete old/unused Mux assets to avoid unnecessary storage costs
- Regenerate Mux API tokens annually as a security best practice

### 7.5 Clearing Cache & Build Issues

```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force .next

# Mac/Linux
rm -rf .next

npm run build
```

---

## 8. Troubleshooting

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Build fails with type errors | Outdated tsconfig or mismatched types | Check `tsconfig.json`, run `npm install`, verify TypeScript version |
| Supabase auth not working | Missing/wrong env vars or callback URL | Verify `SUPABASE_URL` and `ANON_KEY`; check Supabase Auth > URL config includes your domain |
| Stripe webhook not firing | Wrong webhook secret or URL not registered | Verify `STRIPE_WEBHOOK_SECRET`; re-add endpoint URL in Stripe dashboard |
| Video not processing | Mux token invalid or upload failed | Check `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET`; inspect `/api/mux/check-upload` response |
| Emails not sending | Invalid Resend API key or unverified domain | Check `RESEND_API_KEY`; verify sender domain in Resend dashboard |
| PayPal checkout failing | Missing or wrong PayPal credentials | Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `.env.local` |
| Images not loading | Hostname not in `next.config.ts` remotePatterns | Add the image domain to `remotePatterns` in `next.config.ts` |
| Environment variable missing | Not prefixed with `NEXT_PUBLIC_` for client | Only vars prefixed `NEXT_PUBLIC_` are available in the browser |

---

## 9. Deployment

Recommended hosting: **Vercel** (zero-config with Next.js).

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add all `.env.local` variables to Vercel's Environment Variables settings
4. Update **Supabase Auth > Site URL** to your production Vercel URL
5. Re-register the Stripe webhook endpoint with the production URL
6. Deploy — Vercel runs `npm run build` automatically

---

*CyCEC LMS Documentation — Last updated March 2026*