import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, fullName, message } = await request.json();

    // Get cookies and create Supabase client
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Verify the requester is an admin
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

    // Generate a secure token
    const token = crypto.randomUUID();

    // Create invite URL with token (NOT email/name in URL)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/instructor?token=${token}`;

    // Store the invite in database FIRST (before sending email)
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

    // Now send the email with Resend
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Cycec <Contacto@notifications.cycecmexico.com>",
        to: [email],
        subject: "¡Has sido invitado como Instructor!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 13px; padding: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>👨‍🏫 ¡Bienvenido!</h1>
              </div>
              <div class="content">
                <h2>Hola ${fullName},</h2>
                <p>Has sido invitado a unirte como <strong>Instructor</strong> en nuestra plataforma.</p>
                ${message ? `<p style="background: #fff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;"><em>"${message}"</em></p>` : ""}
                <p><strong>Como instructor podrás:</strong></p>
                <ul>
                  <li>✅ Crear y publicar cursos ilimitados</li>
                  <li>📊 Gestionar tu contenido educativo</li>
                  <li>👥 Hacer seguimiento de tus estudiantes</li>
                  <li>💰 Generar ingresos con tus cursos</li>
                </ul>
                <p>Haz clic en el botón de abajo para aceptar la invitación y crear tu cuenta:</p>
                <div style="text-align: center;">
                  <a href="${inviteUrl}" class="button">Aceptar Invitación</a>
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                  <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a>
                </p>
                <p style="font-size: 12px; color: #999;">
                  <strong>Nota:</strong> Esta invitación expira en 7 días.
                </p>
              </div>
              <div class="footer">
                <p>Este enlace es personal y no debe ser compartido.</p>
                <p>&copy; 2025 Cycec. Todos los derechos reservados.</p>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error("Resend email error:", emailError);
        // Don't throw error - invitation is saved in DB, admin can copy link manually
        return NextResponse.json({
          success: true,
          inviteUrl,
          warning: "Invitación guardada pero el correo no se pudo enviar. Comparte el enlace manualmente.",
        });
      }

      console.log("Email sent successfully:", emailData);

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