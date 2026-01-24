"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreateInstructorPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call our API route to send the invite
      const response = await fetch("/api/admin/invite-instructor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar invitación");
      }

      setSuccess(
        `¡Invitación enviada exitosamente a ${email}! El instructor recibirá un correo con el enlace de registro.`
      );
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Crear Cuenta de Instructor
        </h1>
        <p className="text-gray-600 mt-2">
          Envía un enlace de invitación a un nuevo instructor. Ellos recibirán
          un correo para crear su cuenta.
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
            <p className="text-xs text-gray-500 mt-1">
              Se enviará un enlace de invitación a este correo
            </p>
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Enviando invitación..." : "Enviar Invitación"}
          </Button>
        </form>
      </div>

      {/* Instructions Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          📋 Cómo Funciona
        </h3>
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