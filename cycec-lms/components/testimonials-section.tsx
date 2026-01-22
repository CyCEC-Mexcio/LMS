import { Quote } from "lucide-react"

const testimonials = [
  {
    content: "Este curso ha sido una inversión invaluable para mi desarrollo profesional. La formación en ISO 9001:2015 es clara, práctica y fácil de entender. Me siento mucho más seguro al aplicar los principios de calidad en mi trabajo.",
    author: "Álvaro Pérez",
    role: "Profesional en gestión de calidad",
  },
  {
    content: "Lo que más valoro de las capacitaciones de CYCEC México es su enfoque práctico y la relevancia directa de los contenidos para el día a día laboral. Cada sesión aporta herramientas aplicables de inmediato.",
    author: "Monserrat Castillo",
    role: "Coordinadora y Profesional administrativa",
  },
  {
    content: "Este curso en línea fue justo lo que necesitaba. Pude aprender a mi propio ritmo, adaptándolo completamente a mi horario. La plataforma es intuitiva y el contenido está muy bien estructurado.",
    author: "Itzel Andrade",
    role: "Profesional independiente",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Testimonios
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experiencias reales de quienes ya se capacitaron con nosotros.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.author}
              className="bg-background rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow"
            >
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              
              <p className="text-foreground leading-relaxed mb-6">
                {testimonial.content}
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
