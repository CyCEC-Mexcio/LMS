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
  bank_name: string | null;
  account_number: string | null;
  clabe: string | null;
  business_name: string | null;
  rfc: string | null;
  platform_fee_percent: number;
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
  const [processing, setProcessing] = useState<string | boolean>(false);
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

  const handleProcessPayouts = async (mode: 'auto' | 'manual', instructorId?: string) => {
    if (!confirm(instructorId ? '¿Confirmas que se completó la transferencia bancaria para este instructor?' : '¿Confirmas que deseas procesar todos los pagos pendientes ahora?')) return;
    setProcessing(instructorId || 'all');
    setSuccessMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/payouts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, instructorId }),
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

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // ── Chart tooltip ────────────────────────────────────────────────────────
  const [editingFeeFor, setEditingFeeFor] = useState<string | null>(null);
  const [newFee, setNewFee] = useState<string>('');

  const handleUpdateFee = async (instructorId: string) => {
    const parsedFee = parseInt(newFee, 10);
    if (isNaN(parsedFee) || parsedFee < 0 || parsedFee > 100) {
      setError('Porcentaje de comisión inválido (debe ser 0-100)');
      return;
    }

    setProcessing(instructorId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/payouts/fee', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId, platformFeePercent: parsedFee }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar comisión');
      
      setSuccessMsg(`Comisión actualizada al ${parsedFee}% exitosamente.`);
      setEditingFeeFor(null);
      fetchStats();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

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
          disabled={!!processing || !hasPending}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {processing === 'all' ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Procesando...</>
          ) : (
            <><Play className="h-4 w-4" />Procesar Todos</>
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
            sub: 'Monto por transferir a instructores',
            icon: <DollarSign className="h-5 w-5 text-orange-600" />,
            bg: 'bg-gradient-to-br from-orange-50 to-orange-100/60 shadow-sm border border-orange-100/50',
            bold: true,
          },
          {
            label: 'Instructores por Pagar',
            value: stats?.instructorsWithPendingEarnings?.length ?? 0,
            sub: `De ${stats?.totalInstructors ?? 0} instructores activos`,
            icon: <Users className="h-5 w-5 text-purple-600" />,
            bg: 'bg-gradient-to-br from-purple-50 to-purple-100/60 shadow-sm border border-purple-100/50',
            bold: true,
          },
          {
            label: 'Ganancias Plataforma',
            value: fmt(stats?.totalPlatformRevenue ?? 0),
            sub: 'Histórico acumulado de comisiones',
            icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
            bg: 'bg-gradient-to-br from-blue-50 to-blue-100/60 shadow-sm border border-blue-100/50',
            bold: false,
          },
          {
            label: 'Último Pago',
            value: stats?.recentPayouts?.[0] ? fmtDate(stats.recentPayouts[0].processed_at) : 'Sin historial',
            sub: 'Fecha de la última transacción',
            icon: <Calendar className="h-5 w-5 text-emerald-600" />,
            bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 shadow-sm border border-emerald-100/50',
            bold: false,
          },
        ].map((card) => (
          <Card key={card.label} className={`${card.bg} relative overflow-hidden group hover:shadow-md transition-all duration-300`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none transform translate-x-2 -translate-y-2 scale-150">
              {card.icon}
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">{card.label}</p>
                <div className="p-2 bg-white/60 rounded-lg backdrop-blur-sm">
                  {card.icon}
                </div>
              </div>
              <p className={`${card.bold ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900 tracking-tight`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-600 mt-2 font-medium">{card.sub}</p>
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

              {stats!.instructorsWithPendingEarnings.map((instructor) => {
                const isExpanded = expandedRow === instructor.instructor_id;
                const isReadyForPayout = instructor.pending_amount >= 1500;
                return (
                  <div key={instructor.instructor_id} className="bg-gray-50 rounded-lg overflow-hidden transition-colors border">
                    <div 
                      className={`grid grid-cols-1 sm:grid-cols-4 items-center gap-2 px-4 py-3 cursor-pointer hover:bg-orange-50 ${isExpanded ? 'bg-orange-50 border-b' : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : instructor.instructor_id)}
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
                          <Badge variant="outline" className={`text-xs mt-0.5 ${isReadyForPayout ? 'border-orange-200 text-orange-700' : 'text-gray-500'}`}>
                            {isReadyForPayout ? 'Listo para pago' : 'Pendiente (Mín. $1500)'}
                          </Badge>
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

                      {/* Pending & Expand Icon */}
                      <div className="flex items-center justify-end gap-2">
                        <p className={`text-lg font-bold sm:text-right ${isReadyForPayout ? 'text-orange-600' : 'text-gray-500'}`}>
                          {fmt(instructor.pending_amount)}
                        </p>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                    
                    {/* Expanded Banking Info */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Información Bancaria</p>
                            {instructor.bank_name ? (
                              <ul className="text-sm space-y-1 text-gray-600">
                                <li><span className="font-medium">Banco:</span> {instructor.bank_name}</li>
                                <li><span className="font-medium">CLABE:</span> {instructor.clabe}</li>
                                <li><span className="font-medium">Cuenta:</span> {instructor.account_number}</li>
                                {instructor.business_name && <li><span className="font-medium">Razón Social:</span> {instructor.business_name}</li>}
                                {instructor.rfc && <li><span className="font-medium">RFC:</span> {instructor.rfc}</li>}
                              </ul>
                            ) : (
                              <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> El instructor no ha configurado sus datos.
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Comisión de Plataforma</p>
                            {editingFeeFor === instructor.instructor_id ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={newFee}
                                  onChange={(e) => setNewFee(e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="%"
                                />
                                <span className="text-gray-500 text-sm">%</span>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleUpdateFee(instructor.instructor_id)}
                                  disabled={!!processing || newFee === ''}
                                  className="h-8 ml-1"
                                >
                                  Guardar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => setEditingFeeFor(null)}
                                  disabled={!!processing}
                                  className="h-8"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <p className="text-sm text-gray-600">Actual: <span className="font-bold">{instructor.platform_fee_percent}%</span></p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setEditingFeeFor(instructor.instructor_id);
                                    setNewFee(instructor.platform_fee_percent.toString());
                                  }}
                                >
                                  Editar
                                </Button>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">Puedes personalizar la comisión (e.g. 10%, 20%) para este instructor.</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t flex justify-end gap-3 items-center">
                          <p className="text-sm text-gray-500">
                            Realiza la transferencia en tu banco y luego valida el pago aquí.
                          </p>
                          <Button 
                            variant="default"
                            disabled={!instructor.bank_name || !!processing}
                            onClick={() => handleProcessPayouts('manual', instructor.instructor_id)}
                          >
                            {processing === instructor.instructor_id ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                            ) : (
                              <><CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como Pagado</>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
          Los pagos se procesan de forma manual mediante transferencia bancaria. Revisa la información de cada instructor
          depositando la cantidad pendiente directa en su CLABE, y marca la transacción como <strong>Pagado</strong>.
        </AlertDescription>
      </Alert>
    </div>
  );
}