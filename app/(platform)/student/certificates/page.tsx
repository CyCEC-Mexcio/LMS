// app/(platform)/student/certificates/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Download, Award, Calendar } from "lucide-react";

export default async function StudentCertificatesPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // ✅ FIX: Always pass cookieStore to createClient — without it the server
  // client crashes with "Cannot read properties of undefined (reading 'getAll')"
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: certificates, error } = await supabase
    .from("certificates")
    .select(`
      id,
      certificate_number,
      issued_at,
      courses (
        id,
        title,
        slug,
        thumbnail_url,
        instructor_name,
        organization,
        certificate_type
      )
    `)
    .eq("student_id", profile.id)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("Error fetching certificates:", error);
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Mis Certificados</h1>
          <p className="text-gray-600">
            Tus certificados de finalización de cursos
          </p>
        </div>

        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold mb-2">
            Aún no tienes certificados
          </h2>
          <p className="text-gray-600 mb-6">
            Completa un curso para obtener tu primer certificado
          </p>
          <Link href="/browse">
            <Button>Explorar Cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalCertificates = certificates.length;
  const certificadosCount = certificates.filter(
    (c: any) => c.courses?.certificate_type === "certificate"
  ).length;
  const constanciasCount = certificates.filter(
    (c: any) => c.courses?.certificate_type === "constancia"
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Certificados</h1>
        <p className="text-gray-600">
          Has obtenido {totalCertificates} certificado
          {totalCertificates !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {totalCertificates}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {certificadosCount}
              </div>
              <div className="text-sm text-gray-600">Certificados</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {constanciasCount}
              </div>
              <div className="text-sm text-gray-600">Constancias</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert: any) => (
          <Card
            key={cert.id}
            className="hover:shadow-lg transition-shadow overflow-hidden"
          >
            {/* Certificate Header */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-12 h-12 flex-shrink-0" />
                <div>
                  <Badge className="bg-white/20 text-white border-0 mb-1">
                    {cert.courses?.certificate_type === "certificate"
                      ? "Certificado"
                      : cert.courses?.certificate_type === "constancia"
                      ? "Constancia"
                      : "Certificado"}
                  </Badge>
                  <p className="text-sm opacity-90">
                    {cert.courses?.organization || "Independiente"}
                  </p>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">
                {cert.courses?.title || "Curso"}
              </h3>
              <p className="text-sm opacity-90">
                Otorgado a {profile.full_name || "Estudiante"}
              </p>
            </div>

            {/* Certificate Details */}
            <CardContent className="pt-6">
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">Fecha de emisión:</span>
                  <span className="font-medium">
                    {new Date(cert.issued_at).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Award className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 flex-shrink-0">Número:</span>
                  <span className="font-mono text-xs break-all">
                    {cert.certificate_number}
                  </span>
                </div>

                {cert.courses?.instructor_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Instructor:</span>
                    <span className="font-medium">
                      {cert.courses.instructor_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/api/certificates/${cert.id}/download`}
                  className="flex-1"
                  target="_blank"
                >
                  <Button className="w-full" variant="default">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                </Link>
                <Link href={`/student/certificates/${cert.id}`}>
                  <Button variant="outline">Ver</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}