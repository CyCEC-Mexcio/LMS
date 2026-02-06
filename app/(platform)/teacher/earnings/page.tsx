// app/(platform)/teacher/earnings/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DollarSign, CreditCard, TrendingUp, Calendar } from "lucide-react";

export default async function TeacherEarningsPage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check Stripe Connect status
  const hasStripeAccount = !!profile.stripe_account_id;

  // Get all enrollments for this teacher's courses
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      amount_paid,
      payment_method,
      purchased_at,
      courses!inner (
        id,
        title,
        teacher_id
      ),
      profiles!student_id (
        full_name
      )
    `)
    .eq("courses.teacher_id", profile.id)
    .order("purchased_at", { ascending: false });

  // Calculate earnings
  const totalEarnings = enrollments?.reduce(
    (sum, e) => sum + (Number(e.amount_paid) || 0),
    0
  ) || 0;

  // Platform takes 10% fee
  const platformFee = totalEarnings * 0.1;
  const netEarnings = totalEarnings - platformFee;

  // Calculate monthly earnings
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyEarnings = enrollments?.filter((e) => {
    const date = new Date(e.purchased_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).reduce((sum, e) => sum + (Number(e.amount_paid) || 0), 0) || 0;

  const monthlyNet = monthlyEarnings - (monthlyEarnings * 0.1);

  // Group earnings by month
  const earningsByMonth = enrollments?.reduce((acc: any, enrollment) => {
    const date = new Date(enrollment.purchased_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        total: 0,
        count: 0,
      };
    }
    
    acc[monthKey].total += Number(enrollment.amount_paid) || 0;
    acc[monthKey].count += 1;
    
    return acc;
  }, {});

  const monthlyData = Object.values(earningsByMonth || {})
    .sort((a: any, b: any) => b.month.localeCompare(a.month))
    .slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Ganancias</h1>
        <p className="text-gray-600">
          Gestiona tus ingresos y métodos de pago
        </p>
      </div>

      {/* Stripe Connect Status */}
      {!hasStripeAccount && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  Configura tu cuenta de pagos
                </h3>
                <p className="text-gray-700 mb-4">
                  Para recibir pagos de tus cursos, necesitas conectar tu cuenta de Stripe.
                  Esto te permite recibir pagos directamente de tus estudiantes.
                </p>
                <Link href="/api/instructor/stripe-connect">
                  <Button>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Conectar con Stripe
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign size={16} />
              Ganancias Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              ${totalEarnings.toLocaleString("es-MX")}
            </div>
            <div className="text-sm text-gray-600">
              Neto: ${netEarnings.toLocaleString("es-MX")}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Comisión de plataforma: ${platformFee.toLocaleString("es-MX")} (10%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={16} />
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              ${monthlyEarnings.toLocaleString("es-MX")}
            </div>
            <div className="text-sm text-gray-600">
              Neto: ${monthlyNet.toLocaleString("es-MX")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp size={16} />
              Total Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {enrollments?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Inscripciones totales</div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Account Info */}
      {hasStripeAccount && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Estado de la Cuenta</CardTitle>
              <Badge className="bg-green-100 text-green-800">
                Conectada
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Tu cuenta de Stripe está conectada y lista para recibir pagos.
            </p>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <CreditCard className="w-4 h-4 mr-2" />
                Ir al Dashboard de Stripe
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Monthly Breakdown */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ganancias Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((data: any) => {
                const net = data.total - (data.total * 0.1);
                const date = new Date(data.month + "-01");
                const monthName = date.toLocaleDateString("es-MX", {
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div
                    key={data.month}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold capitalize">{monthName}</p>
                      <p className="text-sm text-gray-600">
                        {data.count} venta{data.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ${data.total.toLocaleString("es-MX")}
                      </p>
                      <p className="text-sm text-gray-600">
                        Neto: ${net.toLocaleString("es-MX")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {!enrollments || enrollments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Sin transacciones todavía
              </h3>
              <p className="text-gray-600">
                Tus ventas aparecerán aquí cuando los estudiantes se inscriban
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Fecha</th>
                    <th className="text-left py-3 px-2">Estudiante</th>
                    <th className="text-left py-3 px-2">Curso</th>
                    <th className="text-center py-3 px-2">Método</th>
                    <th className="text-right py-3 px-2">Monto</th>
                    <th className="text-right py-3 px-2">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.slice(0, 20).map((enrollment: any) => {
                    const amount = Number(enrollment.amount_paid) || 0;
                    const net = amount - (amount * 0.1);

                    return (
                      <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm">
                          {new Date(enrollment.purchased_at).toLocaleDateString(
                            "es-MX",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {enrollment.profiles?.full_name || "Usuario"}
                        </td>
                        <td className="py-3 px-2">{enrollment.courses.title}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            {enrollment.payment_method}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          ${amount.toLocaleString("es-MX")}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-green-600">
                          ${net.toLocaleString("es-MX")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Información sobre pagos</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• La plataforma cobra una comisión del 10% sobre cada venta</li>
            <li>• Los pagos se procesan a través de Stripe de forma segura</li>
            <li>• Los fondos se transfieren a tu cuenta según la configuración de Stripe</li>
            <li>• Puedes ver el detalle de cada transacción en tu dashboard de Stripe</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}