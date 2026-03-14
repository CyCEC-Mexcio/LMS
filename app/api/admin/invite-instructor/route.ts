import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, fullName, message } = await request.json();

    const supabase = await createClient();

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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Solo administradores pueden enviar invitaciones" },
        { status: 403 }
      );
    }

    const token = crypto.randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/instructor?token=${token}`;
    const logoUrl = `${baseUrl}/images/Logo.jpg`;

    const { error: insertError } = await supabase
      .from("instructor_invites")
      .insert({
        email,
        full_name: fullName,
        invited_by: user.id,
        message: message || null,
        invite_token: token,
        invite_url: inviteUrl,
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error("Error al guardar la invitación en la base de datos");
    }

    const brandedHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación de Instructor – CYCEC México</title>
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
                      ¡Has sido invitado como Instructor!
                    </h1>
                    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                      Hola <strong style="color:#111827;">${fullName}</strong>, te damos la bienvenida a la plataforma de CYCEC México.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr><td style="height:1px;background:#e5e7eb;font-size:0;">&nbsp;</td></tr>
                    </table>

                    <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1.2px;text-transform:uppercase;">Como instructor podrás</p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr><td style="padding:6px 0;">
                        <table cellpadding="0" cellspacing="0"><tr>
                          <td style="width:36px;vertical-align:middle;font-size:18px;">📚</td>
                          <td style="vertical-align:middle;font-size:14px;color:#374151;">Crear y publicar cursos ilimitados</td>
                        </tr></table>
                      </td></tr>
                      <tr><td style="padding:6px 0;">
                        <table cellpadding="0" cellspacing="0"><tr>
                          <td style="width:36px;vertical-align:middle;font-size:18px;">📊</td>
                          <td style="vertical-align:middle;font-size:14px;color:#374151;">Hacer seguimiento de tus estudiantes</td>
                        </tr></table>
                      </td></tr>
                      <tr><td style="padding:6px 0;">
                        <table cellpadding="0" cellspacing="0"><tr>
                          <td style="width:36px;vertical-align:middle;font-size:18px;">💰</td>
                          <td style="vertical-align:middle;font-size:14px;color:#374151;">Generar ingresos con tus cursos</td>
                        </tr></table>
                      </td></tr>
                      <tr><td style="padding:6px 0;">
                        <table cellpadding="0" cellspacing="0"><tr>
                          <td style="width:36px;vertical-align:middle;font-size:18px;">🏆</td>
                          <td style="vertical-align:middle;font-size:14px;color:#374151;">Gestionar certificados y constancias</td>
                        </tr></table>
                      </td></tr>
                    </table>

                    ${message ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#fff5f5;border-left:3px solid #c53030;border-radius:0 8px 8px 0;padding:14px 16px;">
                          <p style="margin:0 0 5px;font-size:11px;font-weight:700;color:#c53030;letter-spacing:1px;text-transform:uppercase;">Mensaje del administrador</p>
                          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${message}</p>
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
                      ⏳ Esta invitación expira en <strong style="color:#6b7280;">24 Horas</strong>.
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

    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Cycec <Contacto@notifications.cycecmexico.com>",
        to: [email],
        subject: "¡Has sido invitado como Instructor en CYCEC México!",
        html: brandedHtml,
      });

      if (emailError) {
        console.error("Resend email error:", emailError);
        return NextResponse.json({
          success: true,
          inviteUrl,
          warning: "Invitación guardada pero el correo no se pudo enviar. Comparte el enlace manualmente.",
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
        warning: "Invitación guardada pero el correo falló. Comparte el enlace manualmente.",
      });
    }

  } catch (error: any) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear invitación" },
      { status: 500 }
    );
  }
}