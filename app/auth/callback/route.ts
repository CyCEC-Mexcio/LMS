import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/student'
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

  }

  // Determine target redirect based on role if explicit redirect was not provided or is generic
  let targetRedirect = redirect
  const isGenericRedirect = !requestUrl.searchParams.get('redirect') || redirect === '/student' || redirect === '/'

  if (isGenericRedirect) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const roleRedirects: Record<string, string> = {
          admin: '/admin',
          teacher: '/teacher',
          student: '/student',
        }
        if (profile?.role && roleRedirects[profile.role]) {
          targetRedirect = roleRedirects[profile.role]
        }
      }
    } catch (err) {
      console.error('Error fetching role in callback:', err)
    }
  }

  return NextResponse.redirect(new URL(targetRedirect, request.url))
}
