'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2, CheckCircle } from 'lucide-react';

interface CoursePurchaseButtonProps {
  courseId: string;
  price: number;
  currency?: string;
  title: string;
  isEnrolled?: boolean;
  isPublished: boolean;
  isApproved: boolean;
}

export function CoursePurchaseButton({
  courseId,
  price,
  currency = 'MXN',
  title,
  isEnrolled = false,
  isPublished,
  isApproved,
}: CoursePurchaseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Handle free courses
      if (data.free) {
        router.push(`/student/courses/${courseId}`);
        router.refresh();
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.message || 'Algo salió mal. Por favor intenta de nuevo.');
      setLoading(false);
    }
  };

  // Already enrolled
  if (isEnrolled) {
    return (
      <Button
        onClick={() => router.push(`/student/courses/${courseId}`)}
        className="w-full"
        size="lg"
      >
        <CheckCircle className="h-5 w-5 mr-2" />
        Ir al Curso
      </Button>
    );
  }

  // Course not available
  if (!isPublished || !isApproved) {
    return (
      <Button disabled className="w-full" size="lg">
        Curso no disponible
      </Button>
    );
  }

  // Free course
  if (price === 0) {
    return (
      <Button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Inscribiendo...
          </>
        ) : (
          'Inscribirse Gratis'
        )}
      </Button>
    );
  }

  // Paid course
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-bold">{formatPrice(price)}</span>
        <span className="text-sm text-gray-500">Pago único</span>
      </div>
      
      <Button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Comprar Curso
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Acceso de por vida al curso completo
      </p>
    </div>
  );
}