"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, X } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
            <Button className="bg-white text-[#C4161C] hover:bg-white/90 font-semibold">
              Acceder
            </Button>
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
              <Button className="bg-white text-[#C4161C] hover:bg-white/90 font-semibold w-full">
                Acceder
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
