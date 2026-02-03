"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Award, Download, Share2, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CertificateViewerProps {
  courseId: string;
  studentId: string;
}

export default function CertificateViewer({
  courseId,
  studentId,
}: CertificateViewerProps) {
  const supabase = createClient();
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [canGenerate, setCanGenerate] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    checkCertificate();
  }, [courseId, studentId]);

  const checkCertificate = async () => {
    setLoading(true);
    try {
      // Check if certificate exists
      const { data: existingCert } = await supabase
        .from("certificates")
        .select(`
          *,
          course:courses (title, instructor_name, organization)
        `)
        .eq("student_id", studentId)
        .eq("course_id", courseId)
        .single();

      if (existingCert) {
        setCertificate(existingCert);
        setCanGenerate(false);
      } else {
        // Check completion status
        const response = await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, studentId }),
        });

        if (response.ok) {
          const data = await response.json();
          setCertificate(data.certificate);
          setCanGenerate(false);
        } else {
          const error = await response.json();
          if (error.completed !== undefined) {
            setProgress({ completed: error.completed, total: error.total });
          }
          setCanGenerate(false);
        }
      }
    } catch (error) {
      console.error("Error checking certificate:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, studentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCertificate(data.certificate);
        alert("¡Felicidades! Tu certificado ha sido generado.");
      } else {
        const error = await response.json();
        alert(error.error || "No puedes generar el certificado aún");
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Error al generar certificado");
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = () => {
    // In production, this would generate a PDF
    const certificateUrl = `/api/certificates/download?id=${certificate.id}`;
    window.open(certificateUrl, "_blank");
  };

  const shareCertificate = () => {
    const shareUrl = `${window.location.origin}/verify-certificate/${certificate.certificate_number}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Enlace del certificado copiado al portapapeles");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (certificate) {
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
            <div className="my-6 border-t-2 border-gray-200"></div>
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
                  {certificate.course?.organization}
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

        {/* Actions */}
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

  // Not completed yet
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Award className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Certificado de Finalización
        </h3>
        
        {progress.total > 0 ? (
          <>
            <p className="text-gray-600 mb-4">
              Completa todas las lecciones para obtener tu certificado
            </p>
            <div className="max-w-xs mx-auto mb-4">
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
                    width: `${(progress.completed / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-600 mb-4">
            Completa el curso para obtener tu certificado
          </p>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
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
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Ver al menos 80% de cada video</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}