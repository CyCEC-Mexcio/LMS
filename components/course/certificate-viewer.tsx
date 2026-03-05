"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Award, Download, Share2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CertificateViewerProps {
  courseId: string;
  studentId: string;
}

type Status =
  | "loading"       // checking if cert exists
  | "exists"        // cert already in DB
  | "ready"         // all lessons done, can generate
  | "incomplete"    // not all lessons done
  | "generating"    // POST in flight
  | "error";        // unexpected error

export default function CertificateViewer({
  courseId,
  studentId,
}: CertificateViewerProps) {
  const supabase = createClient();
  const [status, setStatus] = useState<Status>("loading");
  const [certificate, setCertificate] = useState<any>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    checkExistingCertificate();
  }, [courseId, studentId]);

  // ✅ FIX: Only CHECK if a certificate exists on mount.
  // Don't call the generate API here — let the user click the button.
  const checkExistingCertificate = async () => {
    setStatus("loading");
    try {
      const { data: existingCert } = await supabase
        .from("certificates")
        .select(`
          *,
          student:profiles!student_id (full_name, email),
          course:courses (title, instructor_name, organization)
        `)
        .eq("student_id", studentId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (existingCert) {
        setCertificate(existingCert);
        setStatus("exists");
        return;
      }

      // No cert yet — check if the student has completed all lessons
      // so we know whether to show the generate button or a progress bar
      await checkCompletionStatus();
    } catch (error) {
      console.error("Error checking certificate:", error);
      setStatus("error");
      setErrorMsg("No se pudo verificar el estado del certificado.");
    }
  };

  const checkCompletionStatus = async () => {
    try {
      // Get sections for this course
      const { data: sections } = await supabase
        .from("sections")
        .select("id")
        .eq("course_id", courseId);

      if (!sections || sections.length === 0) {
        setStatus("incomplete");
        return;
      }

      const sectionIds = sections.map((s: any) => s.id);

      // Get all lessons
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .in("section_id", sectionIds);

      if (!lessons || lessons.length === 0) {
        setStatus("incomplete");
        return;
      }

      const lessonIds = lessons.map((l: any) => l.id);

      // Get completed progress for this student
      const { data: progressData } = await supabase
        .from("progress")
        .select("lesson_id, is_completed")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds)
        .eq("is_completed", true);

      const completedCount = progressData?.length || 0;
      setProgress({ completed: completedCount, total: lessonIds.length });

      if (completedCount >= lessonIds.length) {
        setStatus("ready"); // All lessons done — show the generate button
      } else {
        setStatus("incomplete");
      }
    } catch (error) {
      console.error("Error checking completion:", error);
      setStatus("error");
      setErrorMsg("No se pudo verificar el progreso del curso.");
    }
  };

  const generateCertificate = async () => {
    setStatus("generating");
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, studentId }),
      });

      const data = await response.json();

      if (response.ok && data.certificate) {
        setCertificate(data.certificate);
        setStatus("exists");
      } else {
        // If the API says incomplete, update the progress display
        if (data.completed !== undefined) {
          setProgress({ completed: data.completed, total: data.total });
          setStatus("incomplete");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Error al generar el certificado. Por favor intenta de nuevo.");
        }
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      setStatus("error");
      setErrorMsg("Error de conexión. Por favor intenta de nuevo.");
    }
  };

  const downloadCertificate = () => {
    const certificateUrl = `/api/certificates/download?id=${certificate.id}`;
    window.open(certificateUrl, "_blank");
  };

  const shareCertificate = () => {
    const shareUrl = `${window.location.origin}/verify-certificate/${certificate.certificate_number}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Enlace del certificado copiado al portapapeles");
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Verificando certificado...</span>
      </div>
    );
  }

  // ─── Certificate exists — show it ───────────────────────────────────────────
  if (status === "exists" && certificate) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Curso Completado!
          </h3>
          <p className="text-gray-600">
            Has obtenido tu certificado de finalización
          </p>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 border-4 border-yellow-400">
          <div className="text-center">
            <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Certificado de Finalización
            </h2>
            <div className="my-6 border-t-2 border-gray-200" />
            <p className="text-gray-600 mb-2">Este certificado se otorga a</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">
              {certificate.student?.full_name || "Estudiante"}
            </p>
            <p className="text-gray-600 mb-2">
              Por completar exitosamente el curso
            </p>
            <p className="text-xl font-semibold text-blue-600 mb-6">
              {certificate.course?.title}
            </p>
            <div className="grid grid-cols-2 gap-4 text-left text-sm">
              <div>
                <p className="text-gray-500">Instructor:</p>
                <p className="font-medium text-gray-900">
                  {certificate.course?.instructor_name}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Organización:</p>
                <p className="font-medium text-gray-900">
                  {certificate.course?.organization || "Independiente"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Fecha de emisión:</p>
                <p className="font-medium text-gray-900">
                  {new Date(certificate.issued_at).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Número de certificado:</p>
                <p className="font-mono text-xs text-gray-900">
                  {certificate.certificate_number}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={downloadCertificate}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
          <Button onClick={shareCertificate} variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Compartir
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          Los certificados pueden ser verificados en cualquier momento usando el
          número de certificado
        </p>
      </div>
    );
  }

  // ─── All lessons done — ready to generate ───────────────────────────────────
  if (status === "ready") {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ¡Felicidades! Has completado el curso
          </h3>
          <p className="text-gray-600 mb-6">
            Ya puedes obtener tu certificado de finalización
          </p>
          <Button
            onClick={generateCertificate}
            className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg"
          >
            <Award className="w-5 h-5 mr-2" />
            Obtener Certificado
          </Button>
        </div>
      </div>
    );
  }

  // ─── Generating spinner ──────────────────────────────────────────────────────
  if (status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-600 font-medium">Generando tu certificado...</p>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Ocurrió un error
          </h3>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <Button onClick={checkExistingCertificate} variant="outline">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  // ─── Incomplete — show progress ──────────────────────────────────────────────
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Award className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Certificado de Finalización
        </h3>

        {progress.total > 0 && (
          <>
            <p className="text-gray-600 mb-4">
              Completa todas las lecciones para obtener tu certificado
            </p>
            <div className="max-w-xs mx-auto mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Progreso</span>
                <span className="font-medium text-gray-900">
                  {progress.completed} / {progress.total} lecciones
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{
                    width: `${Math.round(
                      (progress.completed / progress.total) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-sm mx-auto">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Requisitos para el certificado:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Completar todas las lecciones</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Aprobar todos los quizzes (70% mínimo)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}