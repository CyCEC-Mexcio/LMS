"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, X, User, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ role: string; full_name: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        console.log("🔍 Starting getUser...")
        const { data: { user }, error } = await supabase.auth.getUser()
        
        console.log("👤 User result:", { user, error })
        
        if (error) {
          console.error("❌ Error getting user:", error)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        setUser(user)
        console.log("✅ User set:", user?.email)
        
        if (user) {
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .single()
          
          console.log("📋 Profile result:", { profileData, profileError })
          
          if (profileError) {
            console.error("❌ Error getting profile:", profileError)
          }
          
          setProfile(profileData)
        }
      } catch (err) {
        console.error("💥 Unexpected error in getUser:", err)
      } finally {
        console.log("🏁 Setting loading to false")
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.email)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single()
        
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
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
      case "admin":
        return "/admin"
      case "teacher":
        return "/teacher"
      default:
        return "/student"
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-[#8E0F14]/90 backdrop-blur-md border-b border-[#C4161C]/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#C4161C] font-bold text-lg">CY</span>
            </div>
            <span className="font-semibold text-white hidden sm:block">CYCEC México</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center max-w-md flex-1 mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input 
                type="search"
                placeholder="¿Qué quieres aprender?"
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
              />
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#cursos" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
              Cursos
            </Link>
            <Link href="/nosotros" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
              Nosotros
            </Link>
            <Link href="/contacto" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
              Contacto
            </Link>
            
            {loading ? (
              <div className="w-20 h-9 bg-white/20 rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link href={getDashboardLink()}>
                  <Button variant="ghost" className="text-white hover:bg-white/20 gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">
                      {profile?.full_name || "Mi Cuenta"}
                    </span>
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="ghost" 
                  className="text-white hover:bg-white/20"
                  size="icon"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-[#C4161C] hover:bg-white/90 font-semibold">
                  Acceder
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input 
                type="search"
                placeholder="¿Qué quieres aprender?"
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
            </div>
            <nav className="flex flex-col gap-4">
              <Link href="/#cursos" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                Cursos
              </Link>
              <Link href="/nosotros" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                Nosotros
              </Link>
              <Link href="/contacto" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                Contacto
              </Link>
              
              {loading ? (
                <div className="w-full h-9 bg-white/20 rounded animate-pulse" />
              ) : user ? (
                <>
                  <Link href={getDashboardLink()}>
                    <Button variant="ghost" className="text-white hover:bg-white/20 w-full justify-start gap-2">
                      <User className="h-4 w-4" />
                      {profile?.full_name || "Mi Cuenta"}
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleLogout}
                    variant="ghost" 
                    className="text-white hover:bg-white/20 w-full justify-start gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button className="bg-white text-[#C4161C] hover:bg-white/90 font-semibold w-full">
                    Acceder
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}