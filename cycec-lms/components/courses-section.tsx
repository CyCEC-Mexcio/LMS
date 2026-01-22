import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, Users, Wifi } from "lucide-react"

export function CoursesSection() {
  return (
    <section id="cursos" className="py-20 lg:py-28 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-6 text-primary-foreground">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-balance">
              Cursos en Línea Flexibles
            </h2>
            <p className="text-lg text-primary-foreground/80 leading-relaxed max-w-lg">
              Accede a nuestros cursos desde cualquier lugar y avanza a tu propio ritmo, 
              adaptado a tu tiempo y disponibilidad.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/90">Horarios flexibles</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/90">100% en línea</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/90">Soporte continuo</span>
              </div>
            </div>

            <Button 
              size="lg" 
              variant="secondary"
              className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Conocer más
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src="/images/online-learning.jpg"
                alt="Aprendizaje en línea"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
            
            {/* Stats card */}
            <div className="absolute -bottom-6 -right-6 bg-card rounded-xl p-5 shadow-xl border border-border">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Estudiantes activos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
