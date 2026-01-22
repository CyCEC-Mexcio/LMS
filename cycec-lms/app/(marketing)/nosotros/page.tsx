import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Target,
  Eye,
  History,
  TrendingUp,
  CheckCircle2,
  Award,
  Users,
  Building2,
  Handshake,
} from "lucide-react";

export default function NosotrosPage() {
  const impactPoints = [
    "Mejorar oportunidades de empleo y crecimiento profesional",
    "Respaldar la experiencia con certificaciones oficiales",
    "Incrementar la productividad y el desempeño organizacional",
    "Fortalecer la confianza de empresas, clientes y colaboradores",
  ];

  const partners = [
    { name: "ISO", display: "ISO" },
    { name: "ISO 9001:2015", display: "ISO 9001:2015" },
    { name: "ICEMEXICO", display: "ICEMEXICO" },
    { name: "CONOCER", display: "CONOCER" },
    { name: "SEP", display: "SEP" },
  ];

  return (
    <div className="bg-background">
      {/* Hero Quote Section */}
      <section className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <blockquote className="relative">
            <span className="absolute -top-8 -left-4 text-[120px] text-primary/10 font-serif leading-none select-none">
              "
            </span>
            <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground leading-tight text-balance relative z-10">
              Impulsamos personas y organizaciones a través de la certificación
              de competencias, la capacitación práctica y el desarrollo
              profesional.
            </p>
            <footer className="mt-8">
              <p className="text-lg font-semibold text-foreground">
                Porfirio López Cohezaltitla
              </p>
              <p className="text-muted-foreground">Director Ejecutivo</p>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              ¿Quiénes somos?
            </h1>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                CYCEC México es un centro de capacitación, evaluación y
                certificación de competencias enfocado en fortalecer el
                desarrollo profesional de personas y organizaciones en todo
                México.
              </p>
              <p>
                Ofrecemos servicios de consultoría, capacitación especializada y
                evaluación alineada a estándares nacionales, ayudando a validar
                habilidades reales y mejorar el desempeño laboral.
              </p>
              <p>
                Trabajamos bajo esquemas reconocidos, como los estándares del
                Sistema Nacional de Competencias (CONOCER), garantizando
                procesos confiables, transparentes y con valor real para el
                mercado laboral.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Images Banner */}
      <section className="relative h-[300px] md:h-[400px] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          <div className="relative overflow-hidden">
            <Image
              src="/images/about-team-1.jpg"
              alt="Equipo colaborando en oficina moderna"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="relative overflow-hidden">
            <Image
              src="/images/about-team-2.jpg"
              alt="Presentación profesional"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="relative overflow-hidden">
            <Image
              src="/images/about-team-3.jpg"
              alt="Profesional trabajando"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </section>

      {/* Partners Section */}
      <section className="py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Award className="h-6 w-6" />
                <span className="font-semibold">{partner.display}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission, Vision, History, Impact Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Nuestra Historia */}
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Nuestra historia
                </h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  CYCEC México nace a partir de la necesidad creciente de
                  profesionalizar y validar las competencias laborales en un
                  entorno cada vez más competitivo.
                </p>
                <p>
                  Detectamos que muchas personas cuentan con experiencia y
                  conocimientos sólidos, pero carecen de un respaldo formal que
                  lo demuestre. Desde entonces, nuestro propósito ha sido cerrar
                  esa brecha.
                </p>
              </div>
            </div>

            {/* Nuestro Impacto */}
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Nuestro impacto
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                En CYCEC México creemos que una certificación debe representar
                valor real, no solo un documento. Por ello, nuestros servicios
                permiten:
              </p>
              <ul className="space-y-3">
                {impactPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nuestra Misión */}
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Nuestra misión
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Brindar servicios de capacitación, evaluación y certificación de
                competencias accesibles, prácticos y alineados a estándares
                oficiales, que impulsen el desarrollo profesional, la
                empleabilidad y el desempeño de personas y organizaciones.
              </p>
            </div>

            {/* Nuestra Visión */}
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Nuestra visión
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Ser un referente nacional en certificación de competencias y
                capacitación profesional, reconocido por la calidad de nuestros
                servicios, la credibilidad de nuestros procesos y el impacto
                positivo en el desarrollo laboral en México.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#8E0F14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-2">
                500+
              </p>
              <p className="text-white/80 text-sm">Profesionales certificados</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Award className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-2">
                15+
              </p>
              <p className="text-white/80 text-sm">Certificaciones disponibles</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-2">
                50+
              </p>
              <p className="text-white/80 text-sm">Empresas atendidas</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Handshake className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-2">
                98%
              </p>
              <p className="text-white/80 text-sm">Satisfacción del cliente</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl">
            <div className="grid md:grid-cols-2">
              <div className="relative h-48 md:h-auto">
                <Image
                  src="/images/certification-class.jpg"
                  alt="Capacitación profesional"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">
                  Da el siguiente paso en tu desarrollo profesional
                </h2>
                <p className="text-muted-foreground mb-6">
                  Explora nuestros cursos, certifícate en estándares oficiales o
                  contáctanos para recibir asesoría personalizada.
                </p>
                <Button asChild className="w-fit group">
                  <Link href="/cursos">
                    Ver cursos
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
