import Link from "next/link"
import Image from "next/image"
import { Mail, MapPin, Phone } from "lucide-react"

const quickLinks = [
  { label: "Cursos disponibles", href: "/courses" },
  { label: "Certificaciones", href: "/courses" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
]

const contactInfo = [
  { icon: Mail, label: "contacto@cycecmexico.com" },
  { icon: Phone, label: "+52 222 162 5048" },
  { icon: MapPin, label: "Puebla, México" },
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand — matches header style */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 group mb-5">
              <div className="relative w-9 h-9 flex-shrink-0">
                <Image
                  src="/images/CyCEC Mexico Logo.png"
                  alt="CyCEC México"
                  fill
                  className="object-contain drop-shadow-md"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-background font-bold text-base tracking-wide group-hover:text-background/90 transition-colors">
                  CyCEC México
                </span>
                <span className="text-background/45 text-[10px] tracking-widest uppercase font-medium">
                  Plataforma de Aprendizaje
                </span>
              </div>
            </Link>
            <p className="text-background/60 text-sm leading-relaxed">
              Centro de capacitación enfocado en el desarrollo profesional mediante
              cursos alineados a normas ISO y estándares de competencia laboral.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Enlaces rápidos</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-background mb-4">Servicios</h4>
            <ul className="space-y-3">
              <li className="text-sm text-background/60">Atención personalizada</li>
              <li className="text-sm text-background/60">Capacitación para personas y empresas</li>
              <li className="text-sm text-background/60">Modalidad en línea y presencial</li>
              <li className="text-sm text-background/60">Certificación oficial</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-background mb-4">Contáctanos</h4>
            <ul className="space-y-3">
              {contactInfo.map((info) => (
                <li key={info.label} className="flex items-center gap-3">
                  <info.icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-background/60">{info.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Mini logo + copyright */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-5 h-5 flex-shrink-0">
                <Image
                  src="/images/CyCEC Mexico Logo.png"
                  alt="CyCEC México"
                  fill
                  className="object-contain opacity-70"
                />
              </div>
              <span className="text-sm text-background/50">
                © 2025 CyCEC México. Todos los derechos reservados.
              </span>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/aviso-privacidad" className="text-sm text-background/50 hover:text-background transition-colors">
                Aviso de Privacidad
              </Link>
              <Link href="/terminos-condiciones" className="text-sm text-background/50 hover:text-background transition-colors">
                Términos y Condiciones
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <Link
                href="https://www.instagram.com/cycecmexico_?igsh=MTNiZ204bDJ4MTFsaw%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4 text-background" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </Link>
              <Link
                href="https://www.facebook.com/people/Cycec-certificaciones/61567776117798/?mibextid=wwXIfr&rdid=G4NTz1G0Y6Vn6Phb&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1NAJmmvGeA%2F%3Fmibextid%3DwwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4 text-background" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.126-5.864 10.126-11.854z"/>
                </svg>
              </Link>
              {/* TikTok — pending */}
              <div
                className="w-8 h-8 bg-background/5 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed"
                title="TikTok — próximamente"
                aria-label="TikTok (próximamente)"
              >
                <svg className="h-4 w-4 text-background" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}