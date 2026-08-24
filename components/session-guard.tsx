"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const THROTTLE_MS = 60_000 // Only process activity events once per 60s
const STORAGE_KEY = "cycec_last_activity"

/**
 * SessionGuard — client-side session management component.
 *
 * 1. Inactivity auto-logout after 30 min of zero user interaction.
 *    Activity is tracked via throttled mousemove/keydown/click/scroll listeners
 *    (fires once per 60s, not per pixel — zero CPU waste).
 *
 * 2. Cross-tab coordination via localStorage so that activity in ANY tab
 *    resets the timer in ALL tabs (prevents surprise logouts while working
 *    in another tab).
 *
 * 3. Visibility-based catch-up: when a user returns to a tab after being
 *    away (e.g. laptop sleep), it checks elapsed time immediately and logs
 *    out if the inactivity window has passed.
 *
 * Resource impact: 0 server calls, 0 Supabase calls during idle.
 * Only 1 Supabase call (signOut) when timeout fires.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const throttleRef = useRef<boolean>(false)
  const isLoggingOutRef = useRef<boolean>(false)

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.error("SessionGuard: error during signOut", err)
    } finally {
      // Always redirect to login, even if signOut fails
      router.push("/login?reason=inactivity")
      router.refresh()
    }
  }, [router])

  const resetTimer = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now

    // Sync across tabs
    try {
      localStorage.setItem(STORAGE_KEY, String(now))
    } catch {
      // Private browsing or storage full — non-critical
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(performLogout, INACTIVITY_TIMEOUT_MS)
  }, [performLogout])

  const handleActivity = useCallback(() => {
    if (throttleRef.current) return
    throttleRef.current = true
    resetTimer()
    setTimeout(() => {
      throttleRef.current = false
    }, THROTTLE_MS)
  }, [resetTimer])

  useEffect(() => {
    // Skip for public pages (login, register, landing)
    const publicPaths = ["/login", "/register", "/", "/courses", "/nosotros", "/contacto"]
    const isPublic = publicPaths.some(
      (p) => pathname === p || pathname.startsWith("/browse/")
    )
    if (isPublic) return

    // ── 1. Start inactivity timer ──
    resetTimer()

    // ── 2. Attach throttled activity listeners ──
    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart"]
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }))

    // ── 3. Cross-tab sync via storage events ──
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const otherTabActivity = Number(e.newValue)
        if (otherTabActivity > lastActivityRef.current) {
          resetTimer()
        }
      }
    }
    window.addEventListener("storage", onStorageChange)

    // ── 4. Visibility catch-up (laptop wake / tab refocus) ──
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastActivityRef.current
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          performLogout()
        } else {
          // Reset timer with remaining time
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(performLogout, INACTIVITY_TIMEOUT_MS - elapsed)
        }
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    // ── 5. Cleanup on tab close — clear session cookie ──
    const onBeforeUnload = () => {
      // Signal to other tabs that this tab is closing
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // non-critical
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((evt) => window.removeEventListener(evt, handleActivity))
      window.removeEventListener("storage", onStorageChange)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [pathname, resetTimer, handleActivity, performLogout])

  return <>{children}</>
}
