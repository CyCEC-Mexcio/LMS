// proxy.ts (root level)//
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth check for public routes and static assets
  const isPublicRoute = 
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/nosotros" ||
    pathname === "/contacto" ||
    pathname === "/courses" ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/invite/");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const cleanHost = host?.split(":")[0] || "";
  const cookieDomain = cleanHost.endsWith("cycecmexico.com") ? ".cycecmexico.com" : undefined;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookieOptions: {
        domain: cookieDomain,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Protected routes - require authentication
  const isProtectedRoute = 
    pathname.startsWith("/student") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/browse");

  if (isProtectedRoute) {
    const isPaymentReturn = pathname.startsWith("/student/courses") && request.nextUrl.searchParams.get("success") === "true";
    const cookieNames = request.cookies.getAll().map((c) => c.name);

    if (isPaymentReturn || pathname.startsWith("/student/courses")) {
      console.log('🔍 [DIAGNOSTIC: proxy_auth_check_start]', {
        url: request.url,
        pathname,
        search: request.nextUrl.search,
        host,
        cookieNames,
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (isPaymentReturn || pathname.startsWith("/student/courses")) {
      console.log('🔍 [DIAGNOSTIC: proxy_auth_check_result]', {
        pathname,
        hasUser: !!user,
        userId: user?.id,
        authError: authError?.message,
      });
    }

    if (!user) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);

      console.log('⚠️ [DIAGNOSTIC: proxy_redirect_to_login]', {
        redirectTarget: url.toString(),
        reason: 'no_user',
        authError: authError?.message,
      });

      const redirectResponse = NextResponse.redirect(url);
      // Copy staged cookies from supabaseResponse to prevent losing refreshed/updated auth state
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    // Check admin access only if accessing admin routes
    if (pathname.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Teachers are allowed into /admin/students/invite
      const isTeacherAllowed =
        pathname.startsWith("/admin/students/invite") && profile?.role === "teacher";

      if (profile?.role !== "admin" && !isTeacherAllowed) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};