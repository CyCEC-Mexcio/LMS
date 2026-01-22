import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-20 lg:py-28 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src="/images/certification-class.jpg"
                alt="Capacitación profesional"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Respaldo oficial</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
              Capacitación con respaldo oficial
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              En CYCEC México ofrecemos capacitación alineada a normas ISO y estándares de 
              competencia laboral, diseñada para impulsar tu desarrollo profesional y el de 
              tu organización.
            </p>

            <ul className="space-y-3">
              {[
                "Certificaciones reconocidas a nivel nacional",
                "Programas alineados a normas ISO",
                "Validez ante CONOCER y SEP",
                "Instructores con experiencia práctica",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              Conocer certificaciones
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
