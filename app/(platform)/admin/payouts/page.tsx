'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
  Download,
  Play,
  AlertCircle,
} from 'lucide-react';

interface InstructorPendingEarnings {
  instructor_id: string;
  instructor_name: string;
  pending_amount: number;
  transaction_count: number;
}

interface PayoutStats {
  totalPendingPayouts: number;
  totalInstructors: number;
  nextPayoutDate: string;
  instructorsWithPendingEarnings: InstructorPendingEarnings[];
}

export default function AdminPayoutsPage() {
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayoutStats();
  }, []);

  const fetchPayoutStats = async () => {
    try {
      const response = await fetch('/api/admin/payouts/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayouts = async (mode: 'auto' | 'manual') => {
    if (!confirm('¿Estás seguro de que quieres procesar todos los pagos pendientes?')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/payouts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Pagos procesados exitosamente: ${data.processedCount} instructores`);
        fetchPayoutStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert(error.message || 'Error al procesar pagos');
    } finally {
      setProcessing(false);
    }
  };

  const formatMXN = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-gray-600 mt-1">
            Administra los pagos mensuales a instructores
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleProcessPayouts('manual')}
            disabled={processing || !stats?.instructorsWithPendingEarnings.length}
            variant="outline"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Procesar Ahora (Manual)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pendiente
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMXN(stats?.totalPendingPayouts || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Instructores con Pago
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.instructorsWithPendingEarnings.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Instructores
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalInstructors || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Próximo Pago Automático
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats?.nextPayoutDate ? formatDate(stats.nextPayoutDate) : '-'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Primer lunes del mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Los pagos automáticos se procesan el primer lunes de cada mes. 
          También puedes procesarlos manualmente en cualquier momento.
        </AlertDescription>
      </Alert>

      {/* Pending Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pagos Pendientes</CardTitle>
          <CardDescription>
            Instructores con ganancias sin pagar del mes actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.instructorsWithPendingEarnings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay pagos pendientes en este momento
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.instructorsWithPendingEarnings.map((instructor) => (
                <div
                  key={instructor.instructor_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{instructor.instructor_name}</h3>
                    <p className="text-sm text-gray-500">
                      {instructor.transaction_count} ventas este mes
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatMXN(instructor.pending_amount)}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      Pendiente
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}