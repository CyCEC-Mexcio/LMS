// app/api/certificates/[id]/download/route.ts
// Requires: npm install pdf-lib

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ Next.js 15: params is a Promise
) {
  try {
    const { id } = await params; // ✅ Must await before use

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX: include student_id in the select so ownership check works
    const { data: cert, error } = await supabase
      .from("certificates")
      .select(`
        id,
        certificate_number,
        issued_at,
        student_id,
        student:profiles!student_id (full_name),
        course:courses (
          title,
          instructor_name,
          organization,
          certificate_type
        )
      `)
      .eq("id", id)
      .single();

    if (error || !cert) {
      console.error("Certificate fetch error:", error);
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Ownership check — only the student or an admin can download
    if ((cert as any).student_id !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ─── Generate PDF ────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();

    // Landscape A4: 842 x 595 pts
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const courseData  = cert.course  as any;
    const studentData = cert.student as any;

    const isCertificate = courseData?.certificate_type !== "constancia";
    const docTypeLabel  = isCertificate
      ? "CERTIFICADO DE FINALIZACIÓN"
      : "CONSTANCIA DE PARTICIPACIÓN";

    // Helper: draw text centered on x
    const drawCentered = (
      text: string,
      y: number,
      size: number,
      font: typeof fontBold,
      color: ReturnType<typeof rgb>
    ) => {
      const w = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: width / 2 - w / 2, y, size, font, color });
    };

    // ── Background: deep navy ─────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.07, 0.1, 0.2) });

    // ── Gold top + bottom bars ────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: rgb(0.85, 0.65, 0.13) });
    page.drawRectangle({ x: 0, y: 0,          width, height: 8, color: rgb(0.85, 0.65, 0.13) });

    // ── Inner white card ──────────────────────────────────────────────────
    page.drawRectangle({
      x: 40, y: 40,
      width: width - 80, height: height - 80,
      color: rgb(1, 1, 1),
      opacity: 0.97,
    });

    // ── Gold left + right accent strips ───────────────────────────────────
    page.drawRectangle({ x: 40,         y: 40, width: 6, height: height - 80, color: rgb(0.85, 0.65, 0.13) });
    page.drawRectangle({ x: width - 46, y: 40, width: 6, height: height - 80, color: rgb(0.85, 0.65, 0.13) });

    // ── Org name ──────────────────────────────────────────────────────────
    drawCentered(
      (courseData?.organization || "Plataforma LMS").toUpperCase(),
      height - 72, 11, fontBold, rgb(0.85, 0.65, 0.13)
    );

    // ── Document type label ───────────────────────────────────────────────
    drawCentered(docTypeLabel, height - 108, 22, fontBold, rgb(0.07, 0.1, 0.2));

    // ── Gold divider ──────────────────────────────────────────────────────
    page.drawRectangle({
      x: width / 2 - 180, y: height - 120,
      width: 360, height: 1.5,
      color: rgb(0.85, 0.65, 0.13),
    });

    // ── "Se otorga a" ─────────────────────────────────────────────────────
    drawCentered("Se otorga a", height - 155, 13, fontItalic, rgb(0.4, 0.4, 0.4));

    // ── Student name ──────────────────────────────────────────────────────
    const studentName = studentData?.full_name || "Estudiante";
    drawCentered(studentName, height - 205, 36, fontBold, rgb(0.07, 0.1, 0.2));

    // ── Name underline ────────────────────────────────────────────────────
    const nameW = Math.min(fontBold.widthOfTextAtSize(studentName, 36), 400);
    page.drawRectangle({
      x: width / 2 - nameW / 2, y: height - 212,
      width: nameW, height: 2,
      color: rgb(0.85, 0.65, 0.13), opacity: 0.6,
    });

    // ── Completion label ──────────────────────────────────────────────────
    drawCentered(
      isCertificate
        ? "Por haber completado exitosamente el curso"
        : "Por su participación en el curso",
      height - 248, 12, fontRegular, rgb(0.4, 0.4, 0.4)
    );

    // ── Course title (auto-shrink font if too long) ───────────────────────
    const courseTitle = courseData?.title || "Curso";
    let courseFontSize = 24;
    while (
      fontBold.widthOfTextAtSize(courseTitle, courseFontSize) > width - 160 &&
      courseFontSize > 14
    ) courseFontSize -= 1;
    drawCentered(courseTitle, height - 290, courseFontSize, fontBold, rgb(0.15, 0.35, 0.75));

    // ── Bottom info row ───────────────────────────────────────────────────
    const infoY = 108;
    page.drawRectangle({
      x: 70, y: infoY + 48,
      width: width - 140, height: 0.75,
      color: rgb(0.85, 0.85, 0.85),
    });

    const drawInfoCol = (label: string, value: string, x: number) => {
      const lw = fontRegular.widthOfTextAtSize(label, 9);
      page.drawText(label, {
        x: x - lw / 2, y: infoY + 30,
        size: 9, font: fontRegular,
        color: rgb(0.55, 0.55, 0.55),
      });
      let vSize = 12;
      while (fontBold.widthOfTextAtSize(value, vSize) > 190 && vSize > 8) vSize -= 0.5;
      const vw = fontBold.widthOfTextAtSize(value, vSize);
      page.drawText(value, {
        x: x - vw / 2, y: infoY + 12,
        size: vSize, font: fontBold,
        color: rgb(0.07, 0.1, 0.2),
      });
    };

    const issuedDate = new Date((cert as any).issued_at).toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric",
    });

    drawInfoCol("INSTRUCTOR",       courseData?.instructor_name || "—",  140);
    drawInfoCol("FECHA DE EMISIÓN", issuedDate,                          width / 2);
    drawInfoCol("FOLIO",            (cert as any).certificate_number,    width - 140);

    // ── Verify URL ────────────────────────────────────────────────────────
    drawCentered(
      `Verificar en: /verify-certificate/${(cert as any).certificate_number}`,
      52, 8, fontItalic, rgb(0.65, 0.65, 0.65)
    );

    // ── Serialize & return ────────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save();
    const safeTitle = (courseData?.title || "certificado")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}-certificado.pdf"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Error generating certificate PDF" },
      { status: 500 }
    );
  }
}