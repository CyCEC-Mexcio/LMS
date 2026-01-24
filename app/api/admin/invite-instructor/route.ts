import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, fullName, message } = await request.json();

    // Verify the requester is an admin
    const supabase = await createClient(cookies());  // Add 'await' here
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

    // Create invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/invite/instructor?email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}`;

    // Send email with Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Cycec <noreply@notifications.cycecmexico.com>", // Use your verified domain in production
      to: [email],
      subject: "¡Has sido invitado como Instructor en Cycec!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>👨‍🏫 ¡Bienvenido a LearnHub!</h1>
              </div>
              <div class="content">
                <h2>Hola ${fullName},</h2>
                <p>Has sido invitado a unirte a LearnHub como <strong>Instructor</strong>.</p>
                ${message ? `<p><em>"${message}"</em></p>` : ""}
                <p>Como instructor, podrás:</p>
                <ul>
                  <li>Crear y publicar cursos ilimitados</li>
                  <li>Gestionar tu contenido educativo</li>
                  <li>Hacer seguimiento de tus estudiantes</li>
                  <li>Generar ingresos con tus cursos</li>
                </ul>
                <p>Haz clic en el botón de abajo para aceptar la invitación y crear tu cuenta:</p>
                <div style="text-align: center;">
                  <a href="${inviteUrl}" class="button">Aceptar Invitación</a>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 20px;">
                  O copia y pega este enlace en tu navegador:<br>
                  <a href="${inviteUrl}">${inviteUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p>Este enlace es personal y no debe ser compartido.</p>
                <p>&copy; 2025 LearnHub. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error("Error al enviar el correo");
    }

    // Store the invite in database
    const { error: dbError } = await supabase.from("instructor_invites").insert({
      email,
      full_name: fullName,
      invited_by: user.id,
      message,
      invite_url: inviteUrl,
    });

    if (dbError) {
      console.error("Error storing invite:", dbError);
    }

    return NextResponse.json({
      success: true,
      inviteUrl,
      emailId: emailData?.id,
      message: "Invitación enviada exitosamente",
    });
  } catch (error: any) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear invitación" },
      { status: 500 }
    );
  }
}