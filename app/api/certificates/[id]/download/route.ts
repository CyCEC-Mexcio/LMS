// app/api/certificates/[id]/download/route.ts
// Requires: npm install pdf-lib

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15: params is a Promise
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch certificate with course data including logo
    const { data: cert, error } = await supabase
      .from("certificates")
      .select(`
        id,
        certificate_number,
        issued_at,
        student_id,
        course_id,
        student:profiles!student_id (full_name),
        course:courses (
          title,
          instructor_name,
          organization,
          certificate_type,
          certificate_logo_url
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

    // Calculate total course hours from lesson durations
    const courseData = cert.course as any;
    const studentData = cert.student as any;
    const courseId = (cert as any).course_id;

    let totalHours = 0;
    try {
      // Get sections for this course
      const { data: sections } = await supabase
        .from("sections")
        .select("id")
        .eq("course_id", courseId);

      if (sections && sections.length > 0) {
        const sectionIds = sections.map((s: any) => s.id);

        const { data: lessons } = await supabase
          .from("lessons")
          .select("duration_minutes")
          .in("section_id", sectionIds);

        if (lessons) {
          const totalMinutes = lessons.reduce(
            (sum: number, l: any) => sum + (l.duration_minutes || 0),
            0
          );
          totalHours = Math.round(totalMinutes / 60);
        }
      }
    } catch {
      // Fallback: leave totalHours as 0
    }

    const isCertificate = courseData?.certificate_type !== "constancia";
    const docTypeLabel = isCertificate
      ? "OTORGA EL PRESENTE CERTIFICADO"
      : "OTORGA LA PRESENTE CONSTANCIA";

    // ─── Generate PDF ────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();

    // Landscape A4: 842 x 595 pts
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Colors
    const red = rgb(0.56, 0.06, 0.08);        // #8E0F14 — CyCEC brand red
    const darkText = rgb(0.15, 0.15, 0.15);
    const gray = rgb(0.5, 0.5, 0.5);
    const lightGray = rgb(0.75, 0.75, 0.75);
    const veryLightGray = rgb(0.93, 0.93, 0.93);
    const white = rgb(1, 1, 1);

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

    // ── White background ──────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width, height, color: white });

    // ── Red corner brackets (top-left, bottom-right) ──────────────────────
    const bracketThick = 5;
    const bracketLen = 70;

    // Top-left red L
    page.drawRectangle({ x: 25, y: height - 25 - bracketThick, width: bracketLen, height: bracketThick, color: red });
    page.drawRectangle({ x: 25, y: height - 25 - bracketLen, width: bracketThick, height: bracketLen, color: red });

    // Bottom-right red L
    page.drawRectangle({ x: width - 25 - bracketLen, y: 25, width: bracketLen, height: bracketThick, color: red });
    page.drawRectangle({ x: width - 25 - bracketThick, y: 25, width: bracketThick, height: bracketLen, color: red });

    // ── Gray corner brackets (top-right, bottom-left) ─────────────────────
    const grayBracketThick = 3;
    const grayBracketLen = 55;

    // Top-right gray L
    page.drawRectangle({ x: width - 25 - grayBracketLen, y: height - 25 - grayBracketThick, width: grayBracketLen, height: grayBracketThick, color: lightGray });
    page.drawRectangle({ x: width - 25 - grayBracketThick, y: height - 25 - grayBracketLen, width: grayBracketThick, height: grayBracketLen, color: lightGray });

    // Bottom-left gray L
    page.drawRectangle({ x: 25, y: 25, width: grayBracketLen, height: grayBracketThick, color: lightGray });
    page.drawRectangle({ x: 25, y: 25, width: grayBracketThick, height: grayBracketLen, color: lightGray });

    // ── Organization logo (top-left) ──────────────────────────────────────
    const logoUrl = courseData?.certificate_logo_url;
    let logoDrawn = false;

    if (logoUrl) {
      try {
        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok) {
          const logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
          const contentType = logoResponse.headers.get("content-type") || "";

          let logoImage;
          if (contentType.includes("png") || logoUrl.toLowerCase().endsWith(".png")) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          }

          // Draw logo preserving aspect ratio, max 150×80
          const maxW = 150;
          const maxH = 80;
          const aspectRatio = logoImage.width / logoImage.height;
          let drawW = maxW;
          let drawH = drawW / aspectRatio;
          if (drawH > maxH) {
            drawH = maxH;
            drawW = drawH * aspectRatio;
          }

          page.drawImage(logoImage, {
            x: 55,
            y: height - 50 - drawH,
            width: drawW,
            height: drawH,
          });
          logoDrawn = true;
        }
      } catch (logoErr) {
        console.error("Error embedding logo:", logoErr);
      }
    }

    // Fallback: org name in top-left if no logo
    if (!logoDrawn) {
      const orgFallback = (courseData?.organization || "").toUpperCase();
      if (orgFallback) {
        page.drawText(orgFallback, {
          x: 55,
          y: height - 75,
          size: 11,
          font: fontBold,
          color: darkText,
        });
      }
    }

    // ── Organization name (centered, large) ───────────────────────────────
    const orgName = (courseData?.organization || "CyCEC MÉXICO").toUpperCase();
    drawCentered(orgName, height - 85, 22, fontBold, darkText);

    // ── Full legal name (centered, smaller) ───────────────────────────────
    // Only show if the org name is short (i.e. there's likely a longer legal name)
    const legalName = "CONSULTORÍA, CAPACITACIÓN Y CENTRO EVALUADOR DE ESTÁNDARES DE COMPETENCIA EN MÉXICO SAS DE C.V.";
    if (orgName.includes("CYCEC") || orgName.includes("CyCEC")) {
      let legalSize = 7;
      while (fontRegular.widthOfTextAtSize(legalName, legalSize) > width - 120 && legalSize > 5) {
        legalSize -= 0.5;
      }
      drawCentered(legalName, height - 102, legalSize, fontRegular, gray);
    }

    // ── "OTORGA LA PRESENTE CONSTANCIA / CERTIFICADO" ─────────────────────
    drawCentered(docTypeLabel, height - 150, 16, fontBold, darkText);

    // ── "a:" label ────────────────────────────────────────────────────────
    drawCentered("a:", height - 180, 14, fontItalic, gray);

    // ── Student name ──────────────────────────────────────────────────────
    const studentName = studentData?.full_name || "Estudiante";
    let nameSize = 34;
    while (fontBold.widthOfTextAtSize(studentName, nameSize) > width - 160 && nameSize > 18) {
      nameSize -= 1;
    }
    drawCentered(studentName, height - 225, nameSize, fontBold, darkText);

    // ── Red underline under student name ──────────────────────────────────
    const nameW = fontBold.widthOfTextAtSize(studentName, nameSize);
    const underlineW = Math.min(nameW + 40, width - 160);
    page.drawRectangle({
      x: width / 2 - underlineW / 2,
      y: height - 233,
      width: underlineW,
      height: 2.5,
      color: red,
    });

    // ── Completion text ───────────────────────────────────────────────────
    drawCentered(
      "POR SU DESTACADA PARTICIPACIÓN Y ACREDITACIÓN EN EL CURSO EN LÍNEA:",
      height - 268,
      10,
      fontRegular,
      gray
    );

    // ── Course title in light gray box ────────────────────────────────────
    const courseTitle = courseData?.title || "Curso";
    let courseFontSize = 18;
    while (
      fontBold.widthOfTextAtSize(courseTitle, courseFontSize) > width - 200 &&
      courseFontSize > 12
    ) {
      courseFontSize -= 1;
    }
    const courseTitleW = fontBold.widthOfTextAtSize(courseTitle, courseFontSize);
    const boxPadX = 30;
    const boxPadY = 10;
    const boxW = courseTitleW + boxPadX * 2;
    const boxH = courseFontSize + boxPadY * 2;
    const boxX = width / 2 - boxW / 2;
    const boxY = height - 315;

    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      color: veryLightGray,
    });

    page.drawText(courseTitle, {
      x: width / 2 - courseTitleW / 2,
      y: boxY + boxPadY,
      size: courseFontSize,
      font: fontBold,
      color: darkText,
    });

    // ── Bottom section ────────────────────────────────────────────────────
    const bottomY = 90;

    // Signature line (bottom-left)
    const sigLineX = 120;
    const sigLineW = 220;
    page.drawRectangle({
      x: sigLineX,
      y: bottomY + 45,
      width: sigLineW,
      height: 1,
      color: darkText,
    });

    // Signature name
    const sigName = "Lic. Elian Idalyt López Ramírez";
    const sigNameW = fontBold.widthOfTextAtSize(sigName, 9);
    page.drawText(sigName, {
      x: sigLineX + sigLineW / 2 - sigNameW / 2,
      y: bottomY + 30,
      size: 9,
      font: fontBold,
      color: darkText,
    });

    // Signature title
    const sigTitle = "DIRECTORA ACADÉMICA";
    const sigTitleW = fontRegular.widthOfTextAtSize(sigTitle, 8);
    page.drawText(sigTitle, {
      x: sigLineX + sigLineW / 2 - sigTitleW / 2,
      y: bottomY + 18,
      size: 8,
      font: fontRegular,
      color: gray,
    });

    // Hours and date (bottom-right)
    const rightX = width - 300;

    if (totalHours > 0) {
      const hoursText = `FORMACIÓN DE ${totalHours} HORAS`;
      page.drawText(hoursText, {
        x: rightX,
        y: bottomY + 50,
        size: 10,
        font: fontBold,
        color: darkText,
      });
    }

    // Issue date
    const issuedDate = new Date((cert as any).issued_at).toLocaleDateString(
      "es-MX",
      { year: "numeric", month: "long", day: "numeric" }
    );
    const dateLabel = `FECHA DE EXPEDICIÓN: ${issuedDate}`;
    page.drawText(dateLabel, {
      x: rightX,
      y: bottomY + 32,
      size: 9,
      font: fontRegular,
      color: gray,
    });

    // Folio number (bottom center, subtle)
    const folioText = `Folio: ${(cert as any).certificate_number}`;
    const folioW = fontRegular.widthOfTextAtSize(folioText, 7);
    page.drawText(folioText, {
      x: width / 2 - folioW / 2,
      y: 35,
      size: 7,
      font: fontRegular,
      color: lightGray,
    });

    // Verification URL (very bottom, subtle)
    const verifyText = `Verificar en: /verify-certificate/${(cert as any).certificate_number}`;
    const verifyW = fontItalic.widthOfTextAtSize(verifyText, 6.5);
    page.drawText(verifyText, {
      x: width / 2 - verifyW / 2,
      y: 22,
      size: 6.5,
      font: fontItalic,
      color: lightGray,
    });

    // ── Serialize & return ────────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save();
    const safeTitle = (courseData?.title || "certificado")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    const fileLabel = isCertificate ? "certificado" : "constancia";

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}-${fileLabel}.pdf"`,
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