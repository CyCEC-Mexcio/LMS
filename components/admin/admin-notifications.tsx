"use client";

import { useState, useEffect } from "react";
import { Bell, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface AdminNotificationsData {
  pendingCoursesCount: number;
  pendingPayoutsCount: number;
  nextPayoutDate: string;
  daysUntilPayout: number;
  totalNotifications: number;
}

export function AdminNotifications() {
  const [data, setData] = useState<AdminNotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch admin notifications:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
    // Poll every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {data && data.totalNotifications > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b flex justify-between items-center text-sm font-semibold text-gray-700">
              Notificaciones de Admin
              {loading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {!data ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Cargando...
                </div>
              ) : data.totalNotifications === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No tienes notificaciones pendientes.
                </div>
              ) : (
                <div className="flex flex-col">
                  {data.pendingCoursesCount > 0 && (
                    <Link 
                      href="/admin/courses" 
                      onClick={() => setIsOpen(false)}
                      className="p-3 flex items-start gap-3 hover:bg-gray-50 border-b border-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Cursos pendientes
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Tienes {data.pendingCoursesCount} curso(s) esperando revisión y aprobación.
                        </p>
                      </div>
                    </Link>
                  )}
                  {data.pendingPayoutsCount > 0 && (
                    <Link 
                      href="/admin/payouts" 
                      onClick={() => setIsOpen(false)}
                      className="p-3 flex items-start gap-3 hover:bg-orange-50 border-b border-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Pagos a instructores
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Tienes {data.pendingPayoutsCount} instructor(es) listos para recibir su pago.
                        </p>
                      </div>
                    </Link>
                  )}
                  {data.daysUntilPayout <= 3 && (
                    <Link 
                      href="/admin/payouts" 
                      onClick={() => setIsOpen(false)}
                      className="p-3 flex items-start gap-3 hover:bg-emerald-50 border-b border-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Ciclo de pagos próximo
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {data.daysUntilPayout === 0
                            ? '¡Hoy es día de pagos! Revisa los pagos pendientes.'
                            : `Faltan ${data.daysUntilPayout} día(s) para el próximo ciclo de pagos.`}
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
