// lib/email-templates/invite-instructor.ts

export function buildInstructorInviteEmail({
  fullName,
  inviteUrl,
  message,
}: {
  fullName: string;
  inviteUrl: string;
  message?: string;
}): { subject: string; html: string; text: string } {
  const subject = "Has sido invitado como Instructor en CYCEC México";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#1a0000;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#6b0000 0%,#1a0000 60%,#0d0000 100%);min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <!-- Text logo fallback since we can't embed binary images -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:18px 32px;text-align:center;">
                    <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Cy<span style="color:#e53e3e;">CEC</span></span>
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;margin-left:4px;">MÉXICO</span>
                    <div style="font-size:9px;color:rgba(255,255,255,0.5);letter-spacing:1.5px;margin-top:3px;text-transform:uppercase;">Consultoría, Capacitación y Centro Evaluador</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">

              <!-- Red top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#c53030,#9b2c2c);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">

                    <!-- Icon badge -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#c53030,#702020);border-radius:50%;width:56px;height:56px;text-align:center;vertical-align:middle;">
                          <span style="font-size:26px;line-height:56px;">🎓</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Headline -->
                    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">
                      ¡Has sido invitado como Instructor!
                    </h1>
                    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.5;">
                      Hola <strong style="color:#ffffff;">${fullName}</strong>, te damos la bienvenida a la plataforma de CYCEC México.
                    </p>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr><td style="height:1px;background:rgba(255,255,255,0.1);font-size:0;">&nbsp;</td></tr>
                    </table>

                    <!-- Benefits list -->
                    <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase;">Como instructor podrás</p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      ${[
                        ["📚", "Crear y publicar cursos ilimitados"],
                        ["📊", "Hacer seguimiento de tus estudiantes"],
                        ["💰", "Generar ingresos con tus cursos"],
                        ["🏆", "Gestionar certificados y constancias"],
                      ].map(([icon, text]) => `
                      <tr>
                        <td style="padding:8px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:36px;vertical-align:middle;">
                                <span style="font-size:18px;">${icon}</span>
                              </td>
                              <td style="vertical-align:middle;">
                                <span style="font-size:14px;color:rgba(255,255,255,0.8);">${text}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join("")}
                    </table>

                    ${message ? `
                    <!-- Personal message -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:rgba(197,48,48,0.15);border-left:3px solid #c53030;border-radius:0 8px 8px 0;padding:14px 16px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#fc8181;letter-spacing:1px;text-transform:uppercase;">Mensaje del administrador</p>
                          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.5;">${message}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ""}

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td align="center">
                          <a href="${inviteUrl}"
                             style="display:inline-block;background:linear-gradient(135deg,#c53030,#9b2c2c);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:10px;letter-spacing:0.3px;">
                            Aceptar Invitación &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback URL -->
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;">
                      Si el botón no funciona, contactar nuestro suporte:<br/>
                      contacto@cycecmexico.com
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(0,0,0,0.25);padding:16px 40px;border-top:1px solid rgba(255,255,255,0.07);">
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);text-align:center;">
                      ⏳ Esta invitación expira en <strong style="color:rgba(255,255,255,0.6);">7 días</strong>.
                      Este enlace es personal y no debe ser compartido.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.3);">
                © 2025 CYCEC México. Todos los derechos reservados.
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">
                Consultoría, Capacitación y Centro Evaluador
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `¡Has sido invitado como Instructor en CYCEC México!

Hola ${fullName},

Has sido invitado a unirte como Instructor en la plataforma de CYCEC México.

Como instructor podrás:
- Crear y publicar cursos ilimitados
- Hacer seguimiento de tus estudiantes
- Generar ingresos con tus cursos
- Gestionar certificados y constancias
${message ? `\nMensaje del administrador:\n${message}\n` : ""}
Acepta tu invitación aquí:
${inviteUrl}

Esta invitación expira en 24 Horas. Este enlace es personal y no debe ser compartido.

© 2026 CYCEC México. Todos los derechos reservados.`;

  return { subject, html, text };
}