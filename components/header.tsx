// components/header.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ role: string; full_name: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) { setUser(null); setProfile(null); setLoading(false); return }
        setUser(user)
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles").select("role, full_name").eq("id", user.id).single()
          setProfile(profileData)
        }
      } catch (err) {
        console.error("Error in getUser:", err)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles").select("role, full_name").eq("id", session.user.id).single()
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push("/")
    router.refresh()
  }

  const getDashboardLink = () => {
    if (!profile) return "/student"
    switch (profile.role) {
      case "admin":   return "/admin"
      case "teacher": return "/teacher"
      default:        return "/student"
    }
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#7a0b10] shadow-2xl shadow-black/30"
            : "bg-gradient-to-r from-[#6d0c10] via-[#8E0F14] to-[#a01218]"
        }`}
      >
        {/* Top shimmer line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo + Brand */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 flex-shrink-0">
                <Image
                  src="/images/CyCEC Mexico Logo.png"
                  alt="CyCEC México"
                  fill
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-base tracking-wide group-hover:text-white/90 transition-colors">
                  CyCEC México
                </span>
                <span className="text-white/45 text-[10px] tracking-widest uppercase font-medium">
                  Plataforma de Aprendizaje
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/courses"
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150"
              >
                Cursos
              </Link>
              <Link
                href="/nosotros"
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150"
              >
                Nosotros
              </Link>
              <Link
                href="/contacto"
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150"
              >
                Contacto
              </Link>

              {/* Divider */}
              <div className="w-px h-5 bg-white/20 mx-2" />

              {loading ? (
                <div className="w-24 h-9 bg-white/10 rounded-lg animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-1">
                  <Link href={getDashboardLink()}>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="hidden lg:inline max-w-[120px] truncate">
                        {profile?.full_name || "Mi Cuenta"}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <button className="px-5 py-2 bg-white text-[#8E0F14] text-sm font-semibold rounded-lg hover:bg-white/95 shadow-md shadow-black/20 transition-all duration-150 hover:shadow-lg hover:-translate-y-px active:translate-y-0">
                    Acceder
                  </button>
                </Link>
              )}
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Bottom border */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-[66px] inset-x-0 z-40 bg-[#7a0b10] border-t border-white/10 shadow-2xl">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            <Link
              href="/courses"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Cursos
            </Link>
            <Link
              href="/nosotros"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Nosotros
            </Link>
            <Link
              href="/contacto"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Contacto
            </Link>

            <div className="h-px bg-white/10 my-2" />

            {loading ? (
              <div className="w-full h-10 bg-white/10 rounded-lg animate-pulse" />
            ) : user ? (
              <>
                <Link href={getDashboardLink()} onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    {profile?.full_name || "Mi Cuenta"}
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 ml-1.5" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full px-4 py-3 bg-white text-[#8E0F14] text-sm font-semibold rounded-lg hover:bg-white/95 transition-colors shadow-md">
                  Acceder
                </button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}