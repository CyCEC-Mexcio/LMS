// app/(platform)/student/certificates/[id]/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download, ArrowLeft, Share2 } from "lucide-react";

export default async function CertificateViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ MUST await — Next.js 15 params is a Promise

  const profile = await getUserProfile();
  if (!profile) redirect("/login");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: cert, error } = await supabase
    .from("certificates")
    .select(`
      id,
      certificate_number,
      issued_at,
      student_id,
      student:profiles!student_id (full_name),
      course:courses (
        id,
        title,
        instructor_name,
        organization,
        certificate_type
      )
    `)
    .eq("id", id) // ✅ use awaited id, not params.id
    .single();

  if (error || !cert) notFound();

  // Only the owner or admin can view
  if ((cert as any).student_id !== profile.id && profile.role !== "admin") {
    redirect("/student/certificates");
  }

  const courseData  = cert.course  as any;
  const studentData = cert.student as any;
  const isCertificate = courseData?.certificate_type !== "constancia";
  const docTypeLabel  = isCertificate
    ? "Certificado de Finalización"
    : "Constancia de Participación";

  const issuedDate = new Date((cert as any).issued_at).toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Top actions bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link href="/student/certificates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Mis Certificados
          </Button>
        </Link>

        <div className="flex gap-3">
          <Link
            href={`/verify-certificate/${(cert as any).certificate_number}`}
            target="_blank"
          >
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Ver enlace de verificación
            </Button>
          </Link>

          <Link href={`/api/certificates/${id}/download`} target="_blank">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </Link>
        </div>
      </div>

      {/* Certificate card */}
      <div
        className="max-w-4xl mx-auto shadow-2xl"
        style={{ aspectRatio: "842/595" }}
      >
        {/* Outer dark frame */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ backgroundColor: "#111933", borderRadius: 4 }}
        >
          {/* Gold top bar */}
          <div className="absolute top-0 left-0 right-0" style={{ height: 8, backgroundColor: "#D9A621" }} />
          {/* Gold bottom bar */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: 8, backgroundColor: "#D9A621" }} />

          {/* Inner white card */}
          <div
            className="relative bg-white flex flex-col items-center justify-between py-10 px-16"
            style={{
              margin: "40px",
              width: "calc(100% - 80px)",
              height: "calc(100% - 80px)",
              boxSizing: "border-box",
            }}
          >
            {/* Gold left accent */}
            <div className="absolute left-0 top-0 bottom-0" style={{ width: 6, backgroundColor: "#D9A621" }} />
            {/* Gold right accent */}
            <div className="absolute right-0 top-0 bottom-0" style={{ width: 6, backgroundColor: "#D9A621" }} />

            {/* Top section */}
            <div className="text-center w-full">
              <p className="font-bold tracking-widest text-xs mb-3" style={{ color: "#D9A621" }}>
                {(courseData?.organization || "Plataforma LMS").toUpperCase()}
              </p>

              <h1 className="font-bold mb-3" style={{ fontSize: "1.4rem", color: "#111933" }}>
                {docTypeLabel.toUpperCase()}
              </h1>

              <div className="mx-auto mb-4" style={{ width: 360, height: 1.5, backgroundColor: "#D9A621" }} />

              <p className="text-gray-500 italic text-sm mb-2">Se otorga a</p>

              <h2 className="font-bold mb-1" style={{ fontSize: "2.2rem", color: "#111933" }}>
                {studentData?.full_name || "Estudiante"}
              </h2>

              <div
                className="mx-auto mb-4"
                style={{ width: 200, height: 2, backgroundColor: "#D9A621", opacity: 0.6 }}
              />

              <p className="text-gray-500 text-sm mb-2">
                {isCertificate
                  ? "Por haber completado exitosamente el curso"
                  : "Por su participación en el curso"}
              </p>

              <h3 className="font-bold" style={{ fontSize: "1.4rem", color: "#1E40AF" }}>
                {courseData?.title || "Curso"}
              </h3>
            </div>

            {/* Bottom info row */}
            <div className="w-full">
              <div className="mb-4" style={{ height: 0.75, backgroundColor: "#D5D5D5" }} />
              <div className="grid grid-cols-3 text-center gap-4">
                <div>
                  <p className="text-xs tracking-widest mb-1" style={{ color: "#888" }}>INSTRUCTOR</p>
                  <p className="font-bold text-sm" style={{ color: "#111933" }}>
                    {courseData?.instructor_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs tracking-widest mb-1" style={{ color: "#888" }}>FECHA DE EMISIÓN</p>
                  <p className="font-bold text-sm" style={{ color: "#111933" }}>{issuedDate}</p>
                </div>
                <div>
                  <p className="text-xs tracking-widest mb-1" style={{ color: "#888" }}>FOLIO</p>
                  <p className="font-bold text-xs font-mono" style={{ color: "#111933" }}>
                    {(cert as any).certificate_number}
                  </p>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3 italic">
                Verificar en: /verify-certificate/{(cert as any).certificate_number}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-4">
        Para imprimir, usa el botón <strong>Descargar PDF</strong> y luego imprime desde tu lector de PDF.
      </p>
    </div>
  );
}