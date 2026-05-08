import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/student'

  if (code) {
    // ✅ FIX: await cookies()
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    // Claim any pre-assigned pending enrollments for this user
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id && user?.email) {
        const { error: rpcError } = await supabase.rpc('claim_pending_enrollments', {
          user_id: user.id,
          user_email: user.email,
        })
        if (rpcError) {
          console.error('Error claiming pending enrollments:', rpcError)
        }
      }
    } catch (claimError) {
      // Non-blocking: log but don't prevent login redirect
      console.error('Exception claiming pending enrollments:', claimError)
    }
  }

  return NextResponse.redirect(new URL(redirect, request.url))
}
