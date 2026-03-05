import Link from "next/link"
import { FileText, ArrowLeft, Mail, Phone, MapPin, Clock, ArrowRight } from "lucide-react"

export default function TerminosCondicionesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative bg-primary/5 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
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
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">
                Legal
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Términos y Condiciones
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
        <div className="space-y-12">

          {/* Intro */}
          <p className="text-muted-foreground text-lg leading-relaxed border-l-4 border-primary/30 pl-6">
            Al contratar, utilizar o acceder a cualquiera de nuestros servicios, el usuario acepta de manera expresa los presentes términos en su totalidad. Si no está de acuerdo con alguno de ellos, le pedimos abstenerse de utilizar nuestros servicios.
          </p>

          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 rounded-xl p-4">
            Estos Términos y Condiciones se rigen por la legislación mexicana vigente, incluyendo de manera enunciativa mas no limitativa: la Ley Federal de Protección al Consumidor (LFPC), la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), el Código de Comercio y el Código Civil Federal.
          </p>

          {/* Section 1 */}
          <Section number="1" title="Servicios Ofrecidos">
            <p className="text-muted-foreground leading-relaxed mb-5">
              CyCEC México ofrece los siguientes servicios:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "Consultoría en estándares de competencia laboral",
                "Capacitación y formación profesional",
                "Evaluación y certificación ante el CONOCER",
                "Orientación y gestión de trámites relacionados con certificados de competencias",
                "Emisión de presupuestos y cotizaciones personalizadas",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-5 italic">
              CyCEC México se reserva el derecho de modificar, suspender o descontinuar cualquier servicio en cualquier momento, notificando a los clientes afectados con la debida anticipación.
            </p>
          </Section>

          {/* Section 2 */}
          <Section number="2" title="Datos de Contacto que Recopilamos">
            <p className="text-muted-foreground leading-relaxed mb-6">
              Para brindar una atención adecuada e informar sobre nuestros servicios, CyCEC México únicamente recopila los siguientes datos de contacto de manera voluntaria:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <DataCard
                icon="📱"
                title="Número de teléfono / WhatsApp"
                description="Para envío de información y seguimiento de servicios."
              />
              <DataCard
                icon="✉️"
                title="Correo electrónico"
                description="Para envío de información, cotizaciones y comunicados."
              />
            </div>
            <p className="text-sm text-muted-foreground mt-5">
              Estos datos son proporcionados directamente por el usuario a través de nuestros canales de contacto. Su proporción implica el consentimiento para su uso conforme a estos términos y a nuestro Aviso de Privacidad.
            </p>
          </Section>

          {/* Section 3 */}
          <Section number="3" title="Uso de los Datos de Contacto">
            <p className="text-muted-foreground leading-relaxed mb-5">
              Los datos de contacto recopilados serán utilizados exclusivamente para:
            </p>
            <div className="space-y-2">
              {[
                "Enviar información sobre los servicios de CyCEC México",
                "Responder consultas, cotizaciones y solicitudes del usuario",
                "Compartir actualizaciones relevantes sobre certificaciones, cursos y novedades de la empresa",
                "Dar seguimiento a procesos de evaluación o capacitación en curso",
                "Contacto futuro en caso de que el usuario no haya respondido previamente y la empresa considere pertinente mantener su información para dicho fin",
              ].map((item) => (
                <ListItem key={item} text={item} />
              ))}
            </div>
          </Section>

          {/* Section 4 */}
          <Section number="4" title="Protección y Confidencialidad de sus Datos">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-5">
              <p className="text-foreground font-semibold text-center">
                CyCEC México NO vende, cede, ni comparte sus datos de contacto con terceros.
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Bajo ninguna circunstancia la información proporcionada por el usuario (número de teléfono y correo electrónico) será comercializada, transferida ni puesta a disposición de personas físicas o morales ajenas a CyCEC México con fines distintos a los establecidos en estos Términos y en nuestro Aviso de Privacidad.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              La única excepción aplicable es cuando medie requerimiento expreso y fundado por parte de autoridades competentes conforme a la legislación mexicana vigente, tal como lo dispone la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
            </p>
          </Section>

          {/* Section 5 */}
          <Section number="5" title="Conservación y Eliminación de Datos">
            <p className="text-muted-foreground leading-relaxed mb-5">
              CyCEC México conservará los datos de contacto del usuario mientras exista una relación activa de servicio o interés comercial vigente. En caso de que el usuario no haya respondido a comunicaciones de la empresa:
            </p>
            <div className="space-y-2 mb-5">
              {[
                "Queda a criterio exclusivo de CyCEC México eliminar o conservar dicha información para un posible contacto futuro",
                "Esta decisión se tomará atendiendo a criterios de razonabilidad, pertinencia comercial y buenas prácticas de protección de datos",
                "En todo momento el usuario puede solicitar la eliminación de sus datos mediante los mecanismos establecidos en la sección de Derechos ARCO de nuestro Aviso de Privacidad",
              ].map((item) => (
                <ListItem key={item} text={item} />
              ))}
            </div>
            <div className="bg-muted/40 rounded-xl p-4 text-sm text-muted-foreground">
              Una vez solicitada la cancelación por parte del titular, CyCEC México procederá a eliminar o bloquear los datos en un plazo no mayor a <strong className="text-foreground">20 días hábiles</strong>, conforme a lo establecido por la LFPDPPP.
            </div>
          </Section>

          {/* Section 6 */}
          <Section number="6" title="Consentimiento">
            <p className="text-muted-foreground leading-relaxed">
              Al proporcionar sus datos de contacto a CyCEC México por cualquier medio (formulario web, WhatsApp, correo electrónico, llamada telefónica u otros), el usuario otorga su <strong className="text-foreground">consentimiento expreso</strong> para que dichos datos sean tratados conforme a los presentes Términos y Condiciones y al Aviso de Privacidad vigente.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              El usuario puede revocar este consentimiento en cualquier momento, solicitándolo por los medios indicados en la sección 8 del presente documento.
            </p>
          </Section>

          {/* Section 7 */}
          <Section number="7" title="Obligaciones del Usuario">
            <p className="text-muted-foreground leading-relaxed mb-5">
              Al hacer uso de nuestros servicios, el usuario se compromete a:
            </p>
            <div className="space-y-2">
              {[
                "Proporcionar información veraz, completa y actualizada",
                "No utilizar los servicios de CyCEC México con fines ilícitos o contrarios a la legislación mexicana",
                "Notificar a CyCEC México cualquier cambio en sus datos de contacto",
                "No ceder, transferir ni compartir sus credenciales de acceso a terceros, en caso de que aplique",
              ].map((item) => (
                <ListItem key={item} text={item} />
              ))}
            </div>
          </Section>

          {/* Section 8 */}
          <Section number="8" title="Contacto y Ejercicio de Derechos">
            <p className="text-muted-foreground leading-relaxed mb-6">
              Para cualquier consulta, aclaración, solicitud de eliminación de datos o ejercicio de Derechos ARCO (Acceso, Rectificación, Cancelación u Oposición):
            </p>
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider mb-5">
                Departamento de Protección de Datos — CyCEC México
              </p>
              <div className="space-y-3">
                <ContactItem icon={MapPin} text="Los Remedios #21, Col. San Juan Cuautlancingo, CP 72700, Puebla" />
                <ContactItem icon={Phone} text="52 221 427 4476" />
                <ContactItem icon={Mail} text="juridico@cycecmexico.com" />
                <ContactItem icon={Clock} text="Lunes a Viernes, 10:00 a 18:00 hrs" />
              </div>
            </div>
          </Section>

          {/* Section 9 */}
          <Section number="9" title="Modificaciones a los Términos y Condiciones">
            <p className="text-muted-foreground leading-relaxed">
              CyCEC México se reserva el derecho de modificar los presentes Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en el sitio web{" "}
              <a href="https://cycecmexico.com" className="text-primary hover:underline font-medium">
                cycecmexico.com
              </a>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Se recomienda al usuario revisar periódicamente estos términos. El uso continuado de los servicios de CyCEC México posterior a cualquier modificación implica la aceptación de los nuevos términos.
            </p>
          </Section>

          {/* Section 10 */}
          <Section number="10" title="Legislación Aplicable y Jurisdicción">
            <p className="text-muted-foreground leading-relaxed">
              Los presentes Términos y Condiciones se rigen e interpretan de conformidad con las leyes de los Estados Unidos Mexicanos. Para cualquier controversia derivada de su interpretación o cumplimiento, las partes se someten expresamente a la jurisdicción de los tribunales competentes de la ciudad de{" "}
              <strong className="text-foreground">Puebla de Zaragoza, Puebla</strong>, renunciando a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.
            </p>
          </Section>

        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Última actualización: <span className="font-medium text-foreground">Enero 2026</span>
          </p>
          <Link
            href="/aviso-privacidad"
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver Aviso de Privacidad →
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

function DataCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="text-2xl mb-3">{icon}</div>
      <p className="text-sm font-semibold text-foreground mb-2">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}