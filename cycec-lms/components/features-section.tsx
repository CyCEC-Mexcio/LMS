import Image from "next/image"
import { ArrowRight, Award, BadgeCheck, GraduationCap } from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: Award,
    title: "Certificaciones Reconocidas",
    description: "Nuestros cursos están alineados a normas ISO y estándares oficiales, brindando respaldo y confianza a tu formación profesional.",
    link: "Ver certificaciones",
    href: "#certificaciones",
  },
  {
    icon: BadgeCheck,
    title: "Validez Profesional",
    description: "Obtén constancias y certificados con validez profesional que fortalecen tu perfil laboral y empresarial en México.",
    link: "Conoce la validez",
    href: "#validez",
  },
  {
    icon: GraduationCap,
    title: "Instructores Especializados",
    description: "Capacítate con instructores certificados y con experiencia real en la aplicación de normas y procesos profesionales.",
    link: "Conoce a los instructores",
    href: "#instructores",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            ¿Por qué elegir CYCEC México?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ofrecemos la mejor capacitación con respaldo oficial para impulsar tu desarrollo profesional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="group bg-card rounded-2xl p-8 border border-border hover:shadow-xl hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                {feature.description}
              </p>
              
              <Link 
                href={feature.href}
                className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:gap-3 transition-all"
              >
                {feature.link}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
