'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2, CreditCard, ExternalLink } from 'lucide-react';

export default function PaymentSettingsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<{
    isOnboarded: boolean;
    hasAccount: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
  } | null>(null);

  const success = searchParams.get('success');
  const refresh = searchParams.get('refresh');

  // Check onboarding status
  useEffect(() => {
    checkOnboardingStatus();
  }, [success, refresh]);

  const checkOnboardingStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/instructor/stripe-connect');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/instructor/stripe-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/teacher/payment-settings?success=true`,
          refreshUrl: `${window.location.origin}/teacher/payment-settings?refresh=true`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create onboarding link');
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Pagos</h1>
        <p className="text-gray-600 mt-2">
          Conecta tu cuenta de Stripe para recibir pagos de tus cursos
        </p>
      </div>

      {/* Success Alert */}
      {success === 'true' && status?.isOnboarded && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ¡Excelente! Tu cuenta de Stripe está completamente configurada y lista para recibir pagos.
          </AlertDescription>
        </Alert>
      )}

      {/* Refresh Alert */}
      {refresh === 'true' && !status?.isOnboarded && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Parece que no completaste el proceso. Puedes intentarlo de nuevo cuando quieras.
          </AlertDescription>
        </Alert>
      )}

      {/* Stripe Connection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Stripe Connect</CardTitle>
                <CardDescription>
                  Recibe pagos directamente a tu cuenta bancaria
                </CardDescription>
              </div>
            </div>
            {status?.isOnboarded ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary">
                No conectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.isOnboarded ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Pagos habilitados</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Transferencias habilitadas</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">Detalles de Comisión</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Tus ganancias</p>
                    <p className="text-2xl font-bold text-green-600">85%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Comisión plataforma</p>
                    <p className="text-2xl font-bold text-gray-600">15%</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Los pagos se procesan el primer lunes de cada mes
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://dashboard.stripe.com/dashboard', '_blank')}
              >
                Ver Dashboard de Stripe
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  Para recibir pagos de tus cursos, necesitas conectar una cuenta de Stripe.
                  El proceso es rápido y seguro.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-blue-900">¿Qué necesitas?</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Identificación oficial (INE/IFE o Pasaporte)</li>
                    <li>Información bancaria (CLABE interbancaria)</li>
                    <li>RFC (opcional pero recomendado)</li>
                    <li>Comprobante de domicilio</li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={handleConnectStripe}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Conectar con Stripe
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Pagos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium mb-1">Calendario de Pagos</h4>
            <p className="text-gray-600">
              Los pagos se procesan automáticamente el primer lunes de cada mes.Recibirás 
              un correo con el detalle de tus ganancias y un invoice descargable.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Mínimo para Pago</h4>
            <p className="text-gray-600">
              No hay mínimo. Todas las ganancias del mes se transfieren sin importar el monto.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Seguridad</h4>
            <p className="text-gray-600">
              Stripe es una plataforma certificada PCI DSS Level 1. Tus datos bancarios 
              están completamente seguros y encriptados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}