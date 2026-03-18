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
      // Helper: throws with the table name if Supabase returns an error
      const run = async (label: string, query: PromiseLike<{ error: any }>) => {
        const { error } = await query;
        if (error) throw new Error(`[${label}] ${error.message}`);
      };

      // ── 1. Sections → Lessons ──────────────────────────────────────────────
      const { data: sections, error: sectionsErr } = await supabase
        .from("sections")
        .select("id")
        .eq("course_id", courseId);
      if (sectionsErr) throw new Error(`[sections] ${sectionsErr.message}`);

      if (sections && sections.length > 0) {
        const sectionIds = sections.map((s) => s.id);

        const { data: lessons, error: lessonsErr } = await supabase
          .from("lessons")
          .select("id")
          .in("section_id", sectionIds);
        if (lessonsErr) throw new Error(`[lessons select] ${lessonsErr.message}`);

        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map((l) => l.id);

          // Quizzes
          const { data: quizzes, error: quizzesErr } = await supabase
            .from("quizzes")
            .select("id")
            .in("lesson_id", lessonIds);
          if (quizzesErr) throw new Error(`[quizzes select] ${quizzesErr.message}`);

          if (quizzes && quizzes.length > 0) {
            const quizIds = quizzes.map((q) => q.id);
            await run("quiz_attempts delete", supabase.from("quiz_attempts").delete().in("quiz_id", quizIds));
            await run("quiz_questions delete", supabase.from("quiz_questions").delete().in("quiz_id", quizIds));
            await run("quizzes delete", supabase.from("quizzes").delete().in("lesson_id", lessonIds));
          }

          await run("progress delete", supabase.from("progress").delete().in("lesson_id", lessonIds));
          await run("lessons delete", supabase.from("lessons").delete().in("section_id", sectionIds));
        }

        await run("sections delete", supabase.from("sections").delete().eq("course_id", courseId));
      }

      // ── 2. Enrollments → Transactions → Payout items ──────────────────────
      const { data: enrollments, error: enrollmentsErr } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId);
      if (enrollmentsErr) throw new Error(`[enrollments select] ${enrollmentsErr.message}`);

      if (enrollments && enrollments.length > 0) {
        const enrollmentIds = enrollments.map((e) => e.id);

        const { data: transactions, error: txErr } = await supabase
          .from("transactions")
          .select("id")
          .in("enrollment_id", enrollmentIds);
        if (txErr) throw new Error(`[transactions select] ${txErr.message}`);

        if (transactions && transactions.length > 0) {
          const transactionIds = transactions.map((t) => t.id);
          await run("payout_items delete", supabase.from("payout_items").delete().in("transaction_id", transactionIds));
        }

        await run("transactions delete", supabase.from("transactions").delete().in("enrollment_id", enrollmentIds));
        await run("enrollments delete", supabase.from("enrollments").delete().eq("course_id", courseId));
      }

      // ── 3. Remaining course data ───────────────────────────────────────────
      await run("certificates delete", supabase.from("certificates").delete().eq("course_id", courseId));
      await run("reviews delete", supabase.from("reviews").delete().eq("course_id", courseId));
      await run("admin_notifications delete", supabase.from("admin_notifications").delete().eq("course_id", courseId));

      // ── 4. Delete the course itself ────────────────────────────────────────
      const { error: courseError, count } = await supabase
        .from("courses")
        .delete({ count: "exact" })   // returns how many rows were actually deleted
        .eq("id", courseId);

      if (courseError) throw new Error(`[course delete] ${courseError.message}`);

      // count === 0 means RLS silently blocked the delete with no error
      if (count === 0) {
        throw new Error(
          "El curso no fue eliminado. Verifica que tienes permisos de administrador en Supabase (política RLS en la tabla courses)."
        );
      }

      setDeleteDialogOpen(false);
      router.push("/admin/courses");
      router.refresh();
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
              <AlertDescription className="text-red-800 text-xs break-words">
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