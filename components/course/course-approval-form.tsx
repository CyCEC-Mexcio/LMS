"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type CourseApprovalFormProps = {
  course: any;
  adminId: string;
};

export default function CourseApprovalForm({
  course,
  adminId,
}: CourseApprovalFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  
  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    setErrorMessage("");
    
    try {
      const { error } = await supabase
        .from("courses")
        .update({
          is_approved: true,
          approved_by: adminId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", course.id);

      if (error) throw error;

      setApproveDialogOpen(false);
      setSuccessDialogOpen(true);
      
      // Redirect after showing success
      setTimeout(() => {
        router.push("/admin/courses/pending");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error approving course:", error);
      setErrorMessage("Error al aprobar el curso. Por favor intenta de nuevo.");
      setApproveDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      setErrorMessage("Por favor proporciona retroalimentación para el instructor");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    
    try {
      // TODO: Implement rejection logic with feedback storage
      // For now, show a message about pending functionality
      setRejectDialogOpen(false);
      setErrorMessage(
        "Funcionalidad de rechazo pendiente de implementación. Por ahora, contacta al instructor directamente con tu retroalimentación."
      );
    } catch (error) {
      console.error("Error rejecting course:", error);
      setErrorMessage("Error al procesar el rechazo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Aprobar Curso</h1>
        <p className="text-gray-600 mt-1">
          Revisa el curso y decide si aprobarlo
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Course Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-6 flex-col md:flex-row">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full md:w-64 h-40 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full md:w-64 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Sin imagen</span>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {course.title}
                </h2>
                <p className="text-gray-600 mt-2">{course.description}</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Pendiente
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Instructor</p>
                <p className="font-medium">{course.instructor_name}</p>
                {course.organization && (
                  <p className="text-sm text-gray-600">{course.organization}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Categoría</p>
                <p className="font-medium">{course.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nivel</p>
                <p className="font-medium capitalize">{course.level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Precio</p>
                <p className="font-medium">
                  ${course.price?.toFixed(2)} MXN
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          Retroalimentación (Opcional)
        </h3>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Agrega comentarios o sugerencias para el instructor..."
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={() => setRejectDialogOpen(true)}
          disabled={loading}
          variant="outline"
          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
        >
          Rechazar
        </Button>
        <Button
          onClick={() => setApproveDialogOpen(true)}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Aprobar Curso
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar Curso</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas aprobar este curso? El instructor podrá publicarlo inmediatamente después de la aprobación.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Aprobando..." : "Confirmar Aprobación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Curso</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas rechazar este curso? El instructor recibirá tu retroalimentación.
            </DialogDescription>
          </DialogHeader>
          {!feedback.trim() && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Por favor proporciona retroalimentación antes de rechazar el curso
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading || !feedback.trim()}
              variant="destructive"
            >
              {loading ? "Procesando..." : "Confirmar Rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Curso Aprobado
            </DialogTitle>
            <DialogDescription>
              El curso ha sido aprobado exitosamente. Redirigiendo...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}