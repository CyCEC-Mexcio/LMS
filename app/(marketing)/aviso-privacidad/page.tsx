import Link from "next/link"
import { Shield, ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react"

export default function AvisoPrivacidadPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative bg-primary/5 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">
                Legal
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Aviso de Privacidad
              </h1>
              <p className="text-muted-foreground text-lg">
                CYCEC México consultoría, Capacitación y Centro Evaluador de estándares de Competencia en México, S.A.S. DE C.V.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Última actualización: <span className="font-medium text-foreground">Enero 2026</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-12">

          {/* Intro */}
          <p className="text-muted-foreground text-lg leading-relaxed border-l-4 border-primary/30 pl-6">
            De conformidad con lo dispuesto por los artículos 8, 15, 16, 17, 18, 36 y demás relativos de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, hacemos de su conocimiento el presente Aviso de Privacidad para nuestros clientes.
          </p>

          {/* Section 1 */}
          <Section number="1" title="Responsable del Tratamiento de Datos Personales">
            <p className="text-muted-foreground leading-relaxed">
              CYCEC México consultoría, Capacitación y Centro Evaluador de estándares de Competencia en México, S.A.S. DE C.V (en adelante <strong className="text-foreground">"Cycec México"</strong>), con domicilio sede en Los Remedios #21, Colonia San Juan Cuautlancingo, CP 72700, del Municipio de Puebla.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Hemos implementado un Sistema de Gestión de Seguridad de Datos Personales para garantizar el tratamiento correcto de sus datos y cumplir con los Principios Rectores de la Ley.
            </p>

            {/* Contact card */}
            <div className="mt-6 bg-card border border-border rounded-2xl p-6">
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider mb-5">
                Departamento de Protección de Datos
              </p>
              <div className="space-y-3">
                <ContactItem icon={MapPin} text="Los Remedios #21, Col. San Juan Cuautlancingo, CP 72700, Puebla" />
                <ContactItem icon={Phone} text="52 221 427 4476" />
                <ContactItem icon={Mail} text="juridico@cycecmexico.com" />
                <ContactItem icon={Clock} text="Lunes a Viernes, 10:00 a 18:00 hrs" />
              </div>
            </div>
          </Section>

          {/* Section 2 */}
          <Section number="2" title="Información que Recopilamos">
            <p className="text-muted-foreground leading-relaxed mb-5">
              Los datos personales que serán recabados y tratados pueden comprender:
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                "Nombre completo", "Edad y fecha de nacimiento", "Género", "Estado civil",
                "Nacionalidad", "CURP", "Ocupación", "Grado académico",
                "Domicilio particular", "Teléfono(s) celular y oficina",
                "Correo electrónico", "Fotografías",
                "Perfil de redes sociales", "Datos de contacto", "Firma",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Section 3 */}
          <Section number="3" title="Finalidad del Tratamiento">
            <p className="text-muted-foreground leading-relaxed mb-6">
              Recopilamos sus datos personales para las siguientes finalidades:
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <PurposeCard
                type="Primarias"
                color="primary"
                items={[
                  "Identificación y contacto",
                  "Campañas de orientación y formación sobre estándares de competencias",
                  "Registro del cliente en CONOCER",
                  "Gestionar el certificado de competencias",
                  "Emitir presupuestos y cotizaciones",
                  "Atención de quejas y sugerencias",
                  "Cumplir obligaciones legales",
                ]}
              />
              <PurposeCard
                type="Secundarias"
                color="secondary"
                items={[
                  "Encuestas de desarrollo profesional",
                  "Publicidad en redes sociales y página web",
                  "Prospección comercial",
                  "Envío de información actualizada",
                ]}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4 italic">
              Nota: Cycec México recabará y tratará datos sensibles en la categoría de salud cuando sea necesario.
            </p>
          </Section>

          {/* Section 4 */}
          <Section number="4" title="Medios para Obtener los Datos">
            <p className="text-muted-foreground leading-relaxed mb-5">Sus datos serán obtenidos a través de:</p>
            <div className="space-y-2">
              {[
                "De manera directa o personal",
                "Correo electrónico y redes sociales",
                "Formularios en la página web cycecmexico.com",
                "Vía telefónica",
                "Mensajería instantánea (WhatsApp, Telegram)",
                "Documentos oficiales (INE, comprobante de domicilio, etc.)",
              ].map((item) => (
                <ListItem key={item} text={item} />
              ))}
            </div>
          </Section>

          {/* Section 5 */}
          <Section number="5" title="Medidas de Seguridad">
            <p className="text-muted-foreground leading-relaxed">
              Sus datos personales serán resguardados bajo estrictas medidas de seguridad <strong className="text-foreground">administrativa, técnicas y físicas</strong> para protegerlos contra daño, pérdida, alteración, destrucción o uso no autorizado.
            </p>
          </Section>

          {/* Section 6 */}
          <Section number="6" title="Transferencias de Datos">
            <p className="text-muted-foreground leading-relaxed mb-5">
              En caso de ser necesario y por petición de autoridades competentes, CYCEC MÉXICO está facultada para transferir, compartir y tratar sus datos personales. Específicamente podrá compartir su información con:
            </p>
            <div className="space-y-2">
              {[
                "Empresas afiliadas o subsidiarias",
                "Dependencias gubernamentales (municipal, estatal y federal)",
                "Terceros derivados de reestructuración corporativa",
                "Otras transferencias permitidas por la Ley",
              ].map((item) => (
                <ListItem key={item} text={item} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-5 bg-muted/40 rounded-xl p-4">
              En caso de no manifestar su oposición para la transferencia de sus datos, se tendrá por otorgado su consentimiento.
            </p>
          </Section>

          {/* Section 7 */}
          <Section number="7" title="Sus Derechos ARCO">
            <p className="text-muted-foreground leading-relaxed mb-6">
              Usted tiene derecho de <strong className="text-foreground">Acceder, Rectificar y Cancelar</strong> sus datos personales, así como de Oponerse al tratamiento de los mismos o revocar el consentimiento otorgado.
            </p>
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-sm font-semibold text-foreground mb-4">Su solicitud debe contener:</p>
              <div className="space-y-2 mb-6">
                {[
                  "Nombre del titular",
                  "Documento de identidad",
                  "Domicilio o correo electrónico para respuesta",
                  "Descripción de los datos personales sobre los que se pretende ejercer algún derecho",
                  "Cualquier elemento que permita la localización de los datos",
                ].map((item) => (
                  <ListItem key={item} text={item} />
                ))}
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
                Recibirá respuesta en un plazo máximo de <strong className="text-foreground">20 días hábiles</strong> desde la recepción de su solicitud.
              </div>
            </div>
          </Section>

          {/* Section 8 */}
          <Section number="8" title="Consentimiento del Titular">
            <p className="text-muted-foreground leading-relaxed">
              Se entenderá que el titular de los datos personales consiente tácitamente el tratamiento de sus datos cuando, habiéndose puesto a su disposición el presente Aviso de Privacidad, no manifieste su oposición.
            </p>
          </Section>

          {/* Section 9 */}
          <Section number="9" title="Cambios al Aviso de Privacidad">
            <p className="text-muted-foreground leading-relaxed">
              Este aviso puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requisitos legales, políticas de privacidad o cambios en nuestro modelo de negocio. Las modificaciones estarán disponibles en nuestras oficinas y en nuestro sitio web:{" "}
              <a href="https://cycecmexico.com" className="text-primary hover:underline font-medium">
                cycecmexico.com
              </a>
            </p>
          </Section>

          {/* Section 10 */}
          <Section number="10" title="Avisos de Privacidad Relacionados">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Para conocer los avisos de privacidad de organismos relacionados:
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://conocer.gob.mx/documentos/proteccion-de-datos-personales/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                CONOCER →
              </a>
              <a
                href="https://icemexico.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                ICEMEXICO →
              </a>
            </div>
          </Section>

        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Última actualización: <span className="font-medium text-foreground">Enero 2026</span>
          </p>
          <Link
            href="/terminos-condiciones"
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver Términos y Condiciones →
          </Link>
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full tabular-nums">
          {number.padStart(2, "0")}
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ContactItem({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}

function ListItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
      <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
    </div>
  )
}

function PurposeCard({ type, color, items }: { type: string; color: string; items: string[] }) {
  const isPrimary = color === "primary"
  return (
    <div className={`rounded-2xl border p-5 ${isPrimary ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}>
      <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isPrimary ? "text-primary" : "text-muted-foreground"}`}>
        Finalidades {type}
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2.5">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isPrimary ? "bg-primary" : "bg-muted-foreground"}`} />
            <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}