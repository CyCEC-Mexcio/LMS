import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const {
      email,
      fullName,
      courseId,
      pricingMode,       // "full" | "free" | "discount"
      discountPercent,   // number | null
      overridePrice,     // number | null
      note,
    } = await request.json();

    const supabase = await createClient();

    // ── Auth check ──────────────────────────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "teacher"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Solo administradores e instructores pueden enviar invitaciones" },
        { status: 403 }
      );
    }

    // ── Validate course ─────────────────────────────────────────────────────
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, price, instructor_id, instructor_name")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    // Teachers can only invite to their own courses
    if (profile.role === "teacher" && course.instructor_id !== user.id) {
      return NextResponse.json(
        { error: "Solo puedes invitar estudiantes a tus propios cursos" },
        { status: 403 }
      );
    }

    // ── Compute price override ──────────────────────────────────────────────
    let finalOverridePrice: number | null = null;
    let finalDiscountPercent: number | null = null;

    if (pricingMode === "free") {
      finalOverridePrice = 0;
    } else if (pricingMode === "discount") {
      if (discountPercent != null && discountPercent > 0) {
        finalDiscountPercent = discountPercent;
        const basePrice = course.price || 0;
        finalOverridePrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
      } else if (overridePrice != null) {
        finalOverridePrice = overridePrice;
      }
    }
    // pricingMode === "full" → both stay null (full price)

    // ── Build invite token & URL ────────────────────────────────────────────
    const token = crypto.randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/student?token=${token}`;
    const logoUrl = `${baseUrl}/images/Logo.jpg`;

    // ── Insert student_invites row ──────────────────────────────────────────
    const { error: insertError } = await supabase
      .from("student_invites")
      .insert({
        email,
        full_name: fullName || null,
        course_id: courseId,
        invited_by: user.id,
        override_price: finalOverridePrice,
        discount_percent: finalDiscountPercent,
        invite_token: token,
        invite_url: inviteUrl,
        note: note || null,
      });

    if (insertError) {
      console.error("Database insert error (student_invites):", insertError);
      throw new Error("Error al guardar la invitación en la base de datos");
    }

    // ── Insert pending_enrollments row ──────────────────────────────────────
    // This ensures that if the student signs up with Google,
    // claim_pending_enrollments will auto-enroll them.
    const { error: pendingError } = await supabase
      .from("pending_enrollments")
      .insert({
        email,
        course_id: courseId,
      });

    if (pendingError) {
      // If duplicate, that's okay — they already have a pending enrollment
      if (!pendingError.message?.includes("duplicate")) {
        console.error("Database insert error (pending_enrollments):", pendingError);
      }
    }

    // ── Price display helpers ───────────────────────────────────────────────
    let priceLabel = "";
    if (finalOverridePrice === 0) {
      priceLabel = "¡GRATIS!";
    } else if (finalDiscountPercent != null) {
      priceLabel = `${finalDiscountPercent}% de descuento — $${finalOverridePrice?.toFixed(2)} MXN`;
    } else if (finalOverridePrice != null) {
      priceLabel = `$${finalOverridePrice.toFixed(2)} MXN`;
    } else {
      priceLabel = course.price ? `$${Number(course.price).toFixed(2)} MXN` : "Gratuito";
    }

    // ── Build branded HTML email ────────────────────────────────────────────
    const brandedHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación a Curso – CYCEC México</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${logoUrl}" alt="CYCEC México" width="200" style="display:block;height:auto;border:0;" />
            </td>
          </tr>

          <!-- White card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Red top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="background:linear-gradient(90deg,#c53030,#e53e3e);height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">

                    <!-- Icon -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#c53030,#9b2c2c);border-radius:50%;width:52px;height:52px;text-align:center;vertical-align:middle;">
                          <span style="font-size:24px;line-height:52px;">🎓</span>
                        </td>
                      </tr>
                    </table>

                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;line-height:1.3;">
                      ¡Has sido invitado a un curso!
                    </h1>
                    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                      Hola <strong style="color:#111827;">${fullName || "Estudiante"}</strong>, te han invitado a unirte a un curso en la plataforma de CYCEC México.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr><td style="height:1px;background:#e5e7eb;font-size:0;">&nbsp;</td></tr>
                    </table>

                    <!-- Course info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f9fafb;border-radius:12px;overflow:hidden;">
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1.2px;text-transform:uppercase;">Curso</p>
                          <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#111827;">${course.title}</p>
                          
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right:24px;">
                                <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Instructor</p>
                                <p style="margin:0;font-size:14px;color:#374151;font-weight:500;">${course.instructor_name || "CYCEC México"}</p>
                              </td>
                              <td>
                                <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Precio</p>
                                <p style="margin:0;font-size:14px;color:${finalOverridePrice === 0 ? '#16a34a' : '#c53030'};font-weight:700;">${priceLabel}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${note ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#fff5f5;border-left:3px solid #c53030;border-radius:0 8px 8px 0;padding:14px 16px;">
                          <p style="margin:0 0 5px;font-size:11px;font-weight:700;color:#c53030;letter-spacing:1px;text-transform:uppercase;">Mensaje del instructor</p>
                          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${note}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ""}

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <a href="${inviteUrl}"
                            style="display:inline-block;background:linear-gradient(135deg,#c53030,#9b2c2c);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:10px;">
                            Aceptar Invitación &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.8;">
                      Si el botón no funciona, contacta a nuestro equipo de soporte:<br/>
                      <a href="mailto:contacto@cycecmexico.com" style="color:#c53030;font-weight:600;">contacto@cycecmexico.com</a>
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Expiry strip -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f9fafb;padding:14px 40px;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                      ⏳ Esta invitación expira en <strong style="color:#6b7280;">7 días</strong>.
                      Este enlace es personal y no debe ser compartido.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">© 2025 CYCEC México. Todos los derechos reservados.</p>
              <p style="margin:0;font-size:11px;color:#d1d5db;">Consultoría, Capacitación y Centro Evaluador</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

    // ── Send email via Resend ───────────────────────────────────────────────
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Cycec <Contacto@notifications.cycecmexico.com>",
        to: [email],
        subject: `¡Has sido invitado al curso "${course.title}" en CYCEC México!`,
        html: brandedHtml,
      });

      if (emailError) {
        console.error("Resend email error:", emailError);
        return NextResponse.json({
          success: true,
          inviteUrl,
          warning:
            "Invitación guardada pero el correo no se pudo enviar. Comparte el enlace manualmente.",
        });
      }

      return NextResponse.json({
        success: true,
        inviteUrl,
        emailId: emailData?.id,
        message: "Invitación enviada exitosamente",
      });
    } catch (emailErr: any) {
      console.error("Email sending exception:", emailErr);
      return NextResponse.json({
        success: true,
        inviteUrl,
        warning:
          "Invitación guardada pero el correo falló. Comparte el enlace manualmente.",
      });
    }
  } catch (error: any) {
    console.error("Error creating student invite:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear invitación" },
      { status: 500 }
    );
  }
}
