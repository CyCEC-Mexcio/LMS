import { Star } from "lucide-react";

const testimonials = [
  {
    content:
      "Excelente curso, los instructores son muy profesionales y el contenido está muy bien estructurado. Aprendí todo lo necesario para implementar ISO 9001 en mi empresa.",
    author: "Alvaro Pérez",
    role: "Gerente de Calidad",
    image:
      "https://cursoscycecmexico.com/wp-content/uploads/2026/01/cycec-emp1.jpeg",
  },
  {
    content:
      "La plataforma es muy intuitiva y el material didáctico de primera calidad. Recomiendo ampliamente estos cursos para cualquier profesional que busque certificarse.",
    author: "Montserrat Castillo",
    role: "Gerente de seguridad e higiene",
    image:
      "https://cursoscycecmexico.com/wp-content/uploads/2026/01/cycec-emp3.jpeg",
  },
  {
    content:
      "Obtuve mi certificación gracias a esta alineación. El seguimiento personalizado y la atención del equipo de CyCEC México fue excepcional. ¡Totalmente recomendado!",
    author: "Roberto Cepa",
    role: "Responsable de calidad",
    image:
      "https://cursoscycecmexico.com/wp-content/uploads/2026/02/testimonial-colega-de-argentina.jpeg",
  },
];

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
              className="bg-background rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* 5 stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-foreground text-lg leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                />
                <div>
                  <p className="font-bold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}