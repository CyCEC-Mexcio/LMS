"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, X } from "lucide-react";

function EmailPreview({
  fullName,
  message,
  onClose,
}: {
  fullName: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-800">Vista previa del correo</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Email metadata */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 flex-shrink-0 space-y-1">
          <div><span className="font-medium text-gray-700">De:</span> Cycec &lt;Contacto@notifications.cycecmexico.com&gt;</div>
          <div><span className="font-medium text-gray-700">Para:</span> {fullName || "Nombre del Instructor"} &lt;instructor@example.com&gt;</div>
          <div><span className="font-medium text-gray-700">Asunto:</span> ¡Has sido invitado como Instructor en CYCEC México!</div>
        </div>

        {/* Email body preview */}
        <div className="overflow-y-auto flex-1 bg-gray-100">
          <div className="p-8">
            <div className="max-w-lg mx-auto">

              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img
                  src="/images/Logo.jpg"
                  alt="CYCEC México"
                  className="h-16 w-auto object-contain"
                />
              </div>

              {/* White card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg">

                {/* Red top bar */}
                <div style={{ background: "linear-gradient(90deg,#c53030,#e53e3e)", height: 5 }} />

                <div className="p-10">

                  {/* Icon */}
                  <div style={{ background: "linear-gradient(135deg,#c53030,#9b2c2c)", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 24 }}>
                    🎓
                  </div>

                  <h1 style={{ color: "#111827", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
                    ¡Has sido invitado como Instructor!
                  </h1>
                  <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
                    Hola <strong style={{ color: "#111827" }}>{fullName || "Nombre del Instructor"}</strong>, te damos la bienvenida a la plataforma de CYCEC México.
                  </p>

                  <div style={{ height: 1, background: "#e5e7eb", marginBottom: 24 }} />

                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 14 }}>
                    Como instructor podrás
                  </p>

                  {[
                    ["📚", "Crear y publicar cursos ilimitados"],
                    ["📊", "Hacer seguimiento de tus estudiantes"],
                    ["💰", "Generar ingresos con tus cursos"],
                    ["🏆", "Gestionar certificados y constancias"],
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 18, width: 28 }}>{icon}</span>
                      <span style={{ fontSize: 14, color: "#374151" }}>{text}</span>
                    </div>
                  ))}

                  {message && (
                    <div style={{ background: "#fff5f5", borderLeft: "3px solid #c53030", borderRadius: "0 8px 8px 0", padding: "14px 16px", margin: "24px 0" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#c53030", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Mensaje del administrador</p>
                      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }}>{message}</p>
                    </div>
                  )}

                  <div style={{ textAlign: "center", margin: "28px 0 20px" }}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      style={{ display: "inline-block", background: "linear-gradient(135deg,#c53030,#9b2c2c)", color: "#fff", fontSize: 16, fontWeight: 700, textDecoration: "none", padding: "16px 48px", borderRadius: 10 }}
                    >
                      Aceptar Invitación →
                    </a>
                  </div>

                  <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", lineHeight: 1.8 }}>
                    Si el botón no funciona, contacta a nuestro equipo de soporte:<br />
                    <span style={{ color: "#c53030", fontWeight: 600 }}>contacto@cycecmexico.com</span>
                  </p>
                </div>

                {/* Expiry strip */}
                <div style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "14px 40px" }}>
                  <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }}>
                    ⏳ Esta invitación expira en <strong style={{ color: "#6b7280" }}>7 días</strong>.
                    Este enlace es personal y no debe ser compartido.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px" }}>© 2025 CYCEC México. Todos los derechos reservados.</p>
                <p style={{ fontSize: 11, color: "#d1d5db", margin: 0 }}>Consultoría, Capacitación y Centro Evaluador</p>
              </div>

            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar vista previa</Button>
        </div>
      </div>
    </div>
  );
}

export default function CreateInstructorPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const supabase = createClient();

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/invite-instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar invitación");
      }

      setSuccess(`¡Invitación enviada exitosamente a ${email}! El instructor recibirá un correo con el enlace de registro.`);
      setEmail("");
      setFullName("");
      setMessage("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {showPreview && (
        <EmailPreview
          fullName={fullName}
          message={message}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Crear Cuenta de Instructor</h1>
        <p className="text-gray-600 mt-2">
          Envía un enlace de invitación a un nuevo instructor. Ellos recibirán un correo para crear su cuenta.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSendInvite} className="space-y-6">
          <div>
            <Label htmlFor="fullName">Nombre Completo del Instructor</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="instructor@example.com"
              required
              disabled={loading}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Se enviará un enlace de invitación a este correo</p>
          </div>

          <div>
            <Label htmlFor="message">Mensaje Personalizado (Opcional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje de bienvenida para el instructor..."
              disabled={loading}
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Eye size={16} />
              Vista previa
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Enviando invitación..." : "Enviar Invitación"}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Cómo Funciona</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Ingresa el correo del nuevo instructor</li>
          <li>El instructor recibirá un enlace de invitación por correo</li>
          <li>Al hacer clic, podrán crear su contraseña</li>
          <li>Su cuenta será automáticamente configurada como "Instructor"</li>
          <li>Podrán comenzar a crear cursos inmediatamente</li>
        </ol>
      </div>
    </div>
  );
}