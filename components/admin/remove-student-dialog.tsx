"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface RemoveStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  courseId: string;
  courseTitle: string;
  onSuccess: (courseId: string, studentId: string) => void;
}

export function RemoveStudentDialog({
  isOpen,
  onClose,
  studentId,
  studentName,
  studentEmail,
  courseId,
  courseTitle,
  onSuccess,
}: RemoveStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/enrollments/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          studentId,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error al dar de baja al estudiante");
      }

      toast.success(data.message || `Estudiante dado de baja de ${courseTitle}`);
      onSuccess(courseId, studentId);
      onClose();
    } catch (err: any) {
      console.error("Error removing student enrollment:", err);
      toast.error(err.message || "No se pudo completar la baja del estudiante");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-lg">
            <UserMinus className="w-5 h-5 text-red-600" />
            Dar de baja a estudiante del curso
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            ¿Confirmas que deseas eliminar la inscripción de este alumno?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {/* Target Student & Course Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Estudiante:</span>
              <span className="font-semibold text-gray-900 text-sm">{studentName}</span>
            </div>
            {studentEmail && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Correo:</span>
                <span className="text-gray-700 font-medium">{studentEmail}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200/80 pt-1.5 mt-1.5">
              <span>Curso:</span>
              <span className="font-semibold text-gray-900 text-right">{courseTitle}</span>
            </div>
          </div>

          {/* Destructive Warning Details */}
          <div className="bg-red-50/80 border border-red-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-start gap-2 text-red-800 font-medium text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>Consecuencias de esta acción:</span>
            </div>
            <ul className="text-xs text-red-700 space-y-1 list-disc list-inside pl-1">
              <li>Se eliminará la inscripción del estudiante a este curso.</li>
              <li>Se restablecerá el progreso y las lecciones completadas de este curso.</li>
              <li>
                <strong>No se afectará</strong> la cuenta del usuario ni sus inscripciones en otros cursos.
              </li>
            </ul>
          </div>

          {/* Optional reason */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Motivo de la baja (opcional para el registro de auditoría):
            </label>
            <input
              type="text"
              placeholder="Ej. Solicitud directa del alumno, error de compra..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs h-9 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Procesando baja...
              </>
            ) : (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                Confirmar y Dar de Baja
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
