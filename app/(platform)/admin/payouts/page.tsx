'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
  Play,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface InstructorPending {
  instructor_id: string;
  instructor_name: string;
  pending_amount: number;
  total_earned: number;
  paid_earnings: number;
  transaction_count: number;
}

interface RecentPayout {
  id: string;
  instructor_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  transaction_count: number;
  payment_provider: string;
  status: string;
  invoice_number: string;
  processed_at: string;
  created_at: string;
}

interface RevenueSummary {
  month: string;
  total_transactions: number;
  total_revenue: number;
  platform_earnings: number;
  instructor_earnings: number;
}

interface Stats {
  totalPendingPayouts: number;
  totalInstructors: number;
  nextPayoutDate: string;
  totalPlatformRevenue: number;
  instructorsWithPendingEarnings: InstructorPending[];
  recentPayouts: RecentPayout[];
  platformRevenueSummary: RevenueSummary[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(s));

const fmtMonth = (s: string) =>
  new Intl.DateTimeFormat('es-MX', { month: 'short', year: '2-digit' }).format(new Date(s));

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed')
    return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="w-3 h-3" />Completado</Badge>;
  if (status === 'pending')
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1"><Clock className="w-3 h-3" />Pendiente</Badge>;
  if (status === 'failed')
    return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1"><XCircle className="w-3 h-3" />Fallido</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPayoutsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/payouts/stats');
      if (!res.ok) throw new Error((await res.json()).error || 'Error al cargar datos');
      setStats(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayouts = async (mode: 'auto' | 'manual') => {
    if (!confirm('¿Confirmas que deseas procesar todos los pagos pendientes ahora?')) return;
    setProcessing(true);
    setSuccessMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/payouts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar');
      setSuccessMsg(`✓ ${data.processedCount} pago${data.processedCount !== 1 ? 's' : ''} procesado${data.processedCount !== 1 ? 's' : ''} exitosamente.`);
      fetchStats();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  // ── Chart tooltip ────────────────────────────────────────────────────────
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name === 'platform_earnings' ? 'Plataforma' : 'Instructores'}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const hasPending = (stats?.instructorsWithPendingEarnings.length ?? 0) > 0;
  const chartData = (stats?.platformRevenueSummary ?? []).map((r) => ({
    ...r,
    month: fmtMonth(r.month),
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-gray-600 mt-1">Administra los pagos mensuales a instructores</p>
        </div>
        <Button
          onClick={() => handleProcessPayouts('manual')}
          disabled={processing || !hasPending}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {processing ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Procesando...</>
          ) : (
            <><Play className="h-4 w-4" />Procesar Pagos</>
          )}
        </Button>
      </div>

      {/* ── Feedback banners ──────────────────────────────────────────────── */}
      {successMsg && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Pendiente',
            value: fmt(stats?.totalPendingPayouts ?? 0),
            sub: 'Por pagar a instructores',
            icon: <DollarSign className="h-5 w-5 text-orange-500" />,
            bg: 'bg-orange-50',
            bold: true,
          },
          {
            label: 'Total Plataforma',
            value: fmt(stats?.totalPlatformRevenue ?? 0),
            sub: 'Ganancias acumuladas',
            icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
            bg: 'bg-blue-50',
            bold: false,
          },
          {
            label: 'Instructores Activos',
            value: stats?.totalInstructors ?? 0,
            sub: `${stats?.instructorsWithPendingEarnings.length ?? 0} con pago pendiente`,
            icon: <Users className="h-5 w-5 text-purple-500" />,
            bg: 'bg-purple-50',
            bold: false,
          },
          {
            label: 'Próximo Pago Automático',
            value: stats?.nextPayoutDate ? fmtDate(stats.nextPayoutDate) : '—',
            sub: 'Primer lunes del mes',
            icon: <Calendar className="h-5 w-5 text-green-500" />,
            bg: 'bg-green-50',
            bold: false,
          },
        ].map((card) => (
          <Card key={card.label} className={`${card.bg} border-0`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                {card.icon}
              </div>
              <p className={`${card.bold ? 'text-2xl' : 'text-xl'} font-bold text-gray-900`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Revenue chart ─────────────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Mes</CardTitle>
            <CardDescription>Distribución entre plataforma e instructores (últimos 6 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={28} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="platform_earnings"   name="platform_earnings"   fill="#3B82F6" radius={[4,4,0,0]} />
                <Bar dataKey="instructor_earnings" name="instructor_earnings" fill="#8B5CF6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 justify-center mt-2">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />Plataforma
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />Instructores
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pending payouts table ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pagos Pendientes</CardTitle>
              <CardDescription>
                {hasPending
                  ? `${stats!.instructorsWithPendingEarnings.length} instructores con ganancias sin pagar`
                  : 'No hay pagos pendientes en este momento'}
              </CardDescription>
            </div>
            {hasPending && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Total a pagar</p>
                <p className="text-2xl font-bold text-orange-600">
                  {fmt(stats!.totalPendingPayouts)}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasPending ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Todos los pagos están al día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-4 px-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                <span>Instructor</span>
                <span className="text-right">Ventas</span>
                <span className="text-right">Total Ganado</span>
                <span className="text-right">Pendiente</span>
              </div>

              {stats!.instructorsWithPendingEarnings.map((instructor) => (
                <div
                  key={instructor.instructor_id}
                  className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-600">
                        {instructor.instructor_name?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{instructor.instructor_name}</p>
                      <Badge variant="outline" className="text-xs mt-0.5">Pendiente</Badge>
                    </div>
                  </div>

                  {/* Sales */}
                  <p className="text-sm text-gray-600 sm:text-right">
                    <span className="sm:hidden text-gray-400">Ventas: </span>
                    {instructor.transaction_count}
                  </p>

                  {/* Total earned */}
                  <p className="text-sm text-gray-600 sm:text-right">
                    <span className="sm:hidden text-gray-400">Total ganado: </span>
                    {fmt(instructor.total_earned)}
                  </p>

                  {/* Pending */}
                  <p className="text-lg font-bold text-orange-600 sm:text-right">
                    {fmt(instructor.pending_amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Payout history ────────────────────────────────────────────────── */}
      {(stats?.recentPayouts?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center justify-between w-full text-left"
            >
              <div>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>Últimos {stats!.recentPayouts.length} pagos procesados</CardDescription>
              </div>
              {showHistory
                ? <ChevronUp className="w-5 h-5 text-gray-400" />
                : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
          </CardHeader>

          {showHistory && (
            <CardContent>
              <div className="space-y-3">
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-5 px-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  <span>Instructor</span>
                  <span>Periodo</span>
                  <span className="text-right">Transacciones</span>
                  <span className="text-right">Monto</span>
                  <span className="text-right">Estado</span>
                </div>

                {stats!.recentPayouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-sm"
                  >
                    {/* Instructor placeholder — we only have instructor_id in payouts */}
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-xs text-gray-500 truncate max-w-[120px]">
                        {payout.invoice_number || payout.id.slice(0, 8)}
                      </span>
                    </div>

                    {/* Period */}
                    <p className="text-gray-600 text-xs">
                      {fmtDate(payout.period_start)} – {fmtDate(payout.period_end)}
                    </p>

                    {/* Count */}
                    <p className="text-gray-600 sm:text-right">{payout.transaction_count}</p>

                    {/* Amount */}
                    <p className="font-semibold text-gray-900 sm:text-right">
                      {fmt(payout.total_amount)}
                    </p>

                    {/* Status */}
                    <div className="sm:text-right">
                      <StatusBadge status={payout.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* ── Info alert ────────────────────────────────────────────────────── */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          Los pagos automáticos se procesan el primer lunes de cada mes via Stripe Connect.
          Puedes procesarlos manualmente en cualquier momento usando el botón <strong>Procesar Pagos</strong>.
          Solo los instructores con Stripe Connect activo recibirán transferencias directas.
        </AlertDescription>
      </Alert>
    </div>
  );
}