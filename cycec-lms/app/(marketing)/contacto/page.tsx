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
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  ArrowRight,
} from "lucide-react";

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
      title: "WhatsApp",
      value: "+52 221 385 1925",
      href: "https://wa.me/522213851925",
      color: "bg-green-500/10 text-green-600",
    },
    {
      icon: Phone,
      title: "Teléfono",
      value: "+52 221 385 1925",
      href: "tel:+522213851925",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      icon: MapPin,
      title: "Ubicación",
      value: "México",
      href: "#",
      color: "bg-purple-500/10 text-purple-600",
    },
  ];

  const socialLinks = [
    {
      icon: Linkedin,
      name: "LinkedIn",
      handle: "CyCec Mexico",
      href: "https://linkedin.com/company/cycecmexico",
      color: "bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5] hover:text-white",
    },
    {
      icon: Facebook,
      name: "Facebook",
      handle: "CyCEC Mexcio",
      href: "https://facebook.com/cycecmexico",
      color: "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white",
    },
    {
      icon: Instagram,
      name: "Instagram",
      handle: "@cycecmexico",
      href: "https://instagram.com/cycecmexico",
      color: "bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F] hover:text-white",
    },
    {
      icon: Twitter,
      name: "X (Twitter)",
      handle: "@cycecmexico",
      href: "https://twitter.com/cycecmexico",
      color: "bg-[#1F1F1F]/10 text-[#1F1F1F] hover:bg-[#1F1F1F] hover:text-white",
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

            <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/contact-support.jpg"
                alt="Soporte al cliente CYCEC México"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#8E0F14]/60 to-transparent" />
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

      {/* Contact Methods Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Formas de contactarnos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method) => (
              <Link
                key={method.title}
                href={method.href}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <method.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {method.title}
                </h3>
                <p className="text-muted-foreground text-sm">{method.value}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media & Contact Form */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Social Media */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Síguenos en redes sociales
              </h2>
              <p className="text-muted-foreground mb-8">
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
                      <social.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{social.name}</p>
                      <p className="text-sm opacity-80">{social.handle}</p>
                    </div>
                  </Link>
                ))}
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

      {/* Map/Location CTA */}
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
                <Link href="/cursos">Ver cursos disponibles</Link>
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
