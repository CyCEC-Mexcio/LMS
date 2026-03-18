import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Facebook,
  Instagram,
  ArrowRight,
} from "lucide-react";

// TikTok icon (not in lucide-react, so we use a simple SVG)
const TikTokIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-6 w-6"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

export default function ContactoPage() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Correo electrónico",
      value: "contacto@cycecmexico.com",
      href: "mailto:contacto@cycecmexico.com",
      color: "bg-red-500/10 text-red-600",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp / Teléfono",
      value: "+52 221 385 1925",
      href: "https://wa.me/522213851925",
      color: "bg-green-500/10 text-green-600",
    },
    {
      icon: MapPin,
      title: "Ubicación",
      value: "México",
      href: "#mapa",
      color: "bg-purple-500/10 text-purple-600",
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      name: "Facebook",
      handle: "CyCEC México",
      href: "https://facebook.com/cycecmexico",
      color:
        "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white",
    },
    {
      icon: Instagram,
      name: "Instagram",
      handle: "@cycecmexico",
      href: "https://instagram.com/cycecmexico",
      color:
        "bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F] hover:text-white",
    },
    {
      // TikTok
      icon: TikTokIcon,
      name: "TikTok",
      handle: "@cycecmexico",
      href: "https://tiktok.com/@cycecmexico",
      color:
        "bg-[#010101]/10 text-[#010101] hover:bg-[#010101] hover:text-white",
    },
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
                Contacta a CYCEC México
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                ¿Tienes preguntas sobre nuestros cursos, certificaciones o
                servicios de capacitación? Estamos aquí para ayudarte a dar el
                siguiente paso en tu desarrollo profesional.
              </p>

              {/* Quick Contact Card */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      ¿Preguntas o dudas?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Respuesta rápida por WhatsApp
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Lun - Vie</span>
                  </div>
                </div>
                <Button asChild className="w-full sm:w-auto group">
                  <Link href="https://wa.me/522213851925" target="_blank">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar por WhatsApp
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero image — overlay removed */}
            <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/Soporte al cliente CyCEC México.png"
                alt="Soporte al cliente CyCEC México"
                fill
                className="object-cover"
              />
              {/* Subtle bottom gradient for text legibility only — no red hue */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white font-semibold text-lg">
                  Atención personalizada
                </p>
                <p className="text-white/80 text-sm">
                  Te ayudamos a encontrar la mejor opción para ti
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media, Contact Methods & Contact Form */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left column: contact methods + social media */}
            <div className="space-y-10">
              {/* Contact Methods */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Formas de contactarnos
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {contactMethods.map((method) => (
                    <Link
                      key={method.title}
                      href={method.href}
                      className="bg-card rounded-2xl p-5 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div
                        className={`w-11 h-11 rounded-xl ${method.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <method.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">
                        {method.title}
                      </h3>
                      <p className="text-muted-foreground text-xs">{method.value}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Síguenos en redes sociales
                </h2>
                <p className="text-muted-foreground mb-6">
                  Mantente al día con nuestras novedades, cursos y consejos para
                  tu desarrollo profesional.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {socialLinks.map((social) => (
                    <Link
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      className={`flex items-center gap-4 p-4 rounded-xl border border-border bg-card ${social.color} transition-all duration-300 group`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-current/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <social.icon />
                      </div>
                      <div>
                        <p className="font-semibold">{social.name}</p>
                        <p className="text-sm opacity-80">{social.handle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Envíanos un mensaje
              </h2>
              <p className="text-muted-foreground mb-6">
                Completa el formulario y te responderemos a la brevedad.
              </p>
              <form className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      placeholder="Tu nombre"
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      placeholder="Tu apellido"
                      className="bg-muted/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="+52 000 000 0000"
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asunto">Asunto</Label>
                  <Input
                    id="asunto"
                    placeholder="¿Sobre qué tema deseas contactarnos?"
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <Textarea
                    id="mensaje"
                    placeholder="Escribe tu mensaje aquí..."
                    rows={4}
                    className="bg-muted/50 resize-none"
                  />
                </div>
                <Button type="submit" className="w-full group">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar mensaje
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps Section */}
      <section id="mapa" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Nuestra ubicación
            </h2>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              Puebla, México
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden border border-border shadow-lg h-[400px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d120877.46064541853!2d-98.28509439453125!3d19.041443!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cfc0d6b6ded52b%3A0x3b7a26fb53df7478!2sPuebla%2C%20Pue.%2C%20Mexico!5e0!3m2!1sen!2smx!4v1700000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación CyCEC México — Puebla"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-[#8E0F14] rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              ¿Listo para impulsar tu carrera?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Contáctanos hoy y descubre cómo nuestras certificaciones y cursos
              pueden ayudarte a alcanzar tus metas profesionales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                variant="secondary"
                className="bg-white text-[#8E0F14] hover:bg-white/90"
              >
                <Link href="/courses">Ver cursos disponibles</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white text-white hover:bg-white/10 bg-transparent"
              >
                <Link href="https://wa.me/522213851925" target="_blank">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp directo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}