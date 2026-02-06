"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

type DeleteCourseButtonProps = {
  courseId: string;
  courseTitle: string;
};

export default function DeleteCourseButton({
  courseId,
  courseTitle,
}: DeleteCourseButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      // Get sections first to delete lessons and their related data
      const { data: sections } = await supabase
        .from("sections")
        .select("id")
        .eq("course_id", courseId);

      if (sections && sections.length > 0) {
        const sectionIds = sections.map((s) => s.id);

        // Get all lessons in these sections
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .in("section_id", sectionIds);

        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map((l) => l.id);

          // Delete quiz attempts first (references quiz_questions indirectly through quizzes)
          const { data: quizzes } = await supabase
            .from("quizzes")
            .select("id")
            .in("lesson_id", lessonIds);

          if (quizzes && quizzes.length > 0) {
            const quizIds = quizzes.map((q) => q.id);
            
            // Delete quiz attempts
            await supabase
              .from("quiz_attempts")
              .delete()
              .in("quiz_id", quizIds);

            // Delete quiz questions
            await supabase
              .from("quiz_questions")
              .delete()
              .in("quiz_id", quizIds);

            // Delete quizzes
            await supabase
              .from("quizzes")
              .delete()
              .in("lesson_id", lessonIds);
          }

          // Delete progress
          await supabase
            .from("progress")
            .delete()
            .in("lesson_id", lessonIds);

          // Delete lessons
          await supabase
            .from("lessons")
            .delete()
            .in("section_id", sectionIds);
        }

        // Delete sections
        await supabase.from("sections").delete().eq("course_id", courseId);
      }

      // Get enrollments to delete transactions
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId);

      if (enrollments && enrollments.length > 0) {
        const enrollmentIds = enrollments.map((e) => e.id);

        // Delete payout_items that reference transactions for this course
        const { data: transactions } = await supabase
          .from("transactions")
          .select("id")
          .in("enrollment_id", enrollmentIds);

        if (transactions && transactions.length > 0) {
          const transactionIds = transactions.map((t) => t.id);
          
          // Delete payout items
          await supabase
            .from("payout_items")
            .delete()
            .in("transaction_id", transactionIds);
        }

        // Delete transactions
        await supabase
          .from("transactions")
          .delete()
          .in("enrollment_id", enrollmentIds);
      }

      // Delete enrollments
      await supabase.from("enrollments").delete().eq("course_id", courseId);

      // Delete certificates
      await supabase.from("certificates").delete().eq("course_id", courseId);

      // Delete reviews
      await supabase.from("reviews").delete().eq("course_id", courseId);

      // Delete admin notifications
      await supabase
        .from("admin_notifications")
        .delete()
        .eq("course_id", courseId);

      // Finally, delete the course itself
      const { error: courseError } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (courseError) throw courseError;

      setDeleteDialogOpen(false);
      router.refresh();
      router.push("/admin/courses"); // Navigate back to courses list
    } catch (err: any) {
      console.error("Error deleting course:", err);
      setError(err.message || "Error al eliminar el curso");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setDeleteDialogOpen(true)}
        className="text-red-600 hover:text-red-900 font-medium"
      >
        Eliminar
      </button>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Eliminar Curso
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el curso{" "}
              <strong>{courseTitle}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              Esta acción es irreversible y eliminará:
            </p>
            <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
              <li>Todos los capítulos y lecciones</li>
              <li>Todos los quizzes y contenido del curso</li>
              <li>Todas las inscripciones de estudiantes</li>
              <li>Todo el progreso de los estudiantes</li>
              <li>Todas las reseñas y calificaciones</li>
              <li>Todos los certificados emitidos</li>
              <li>Todas las transacciones relacionadas</li>
            </ul>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}