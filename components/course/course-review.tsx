"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, Send, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  courseId: string;
  studentId: string;
};

export default function CourseReview({ courseId, studentId }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState<{
    id: string;
    rating: number;
    comment: string | null;
  } | null>(null);
  const [editing, setEditing] = useState(false);

  const supabase = createClient();

  // Load existing review on mount
  useEffect(() => {
    const fetchReview = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("course_id", courseId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (data) {
        setExistingReview(data);
        setRating(data.rating);
        setComment(data.comment || "");
        setSubmitted(true);
      }
    };
    fetchReview();
  }, [courseId, studentId]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      if (existingReview) {
        // Update
        await supabase
          .from("reviews")
          .update({ rating, comment, updated_at: new Date().toISOString() })
          .eq("id", existingReview.id);

        setExistingReview({ ...existingReview, rating, comment });
      } else {
        // Insert
        const { data } = await supabase
          .from("reviews")
          .insert({ course_id: courseId, student_id: studentId, rating, comment })
          .select("id, rating, comment")
          .single();

        if (data) setExistingReview(data);
      }

      setSubmitted(true);
      setEditing(false);
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const labels = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];
  const displayRating = hovered || rating;

  // ── Already submitted, not editing ──────────────────────────────────────
  if (submitted && !editing) {
    return (
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800 mb-1">¡Gracias por tu reseña!</p>
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i <= (existingReview?.rating ?? rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
                <span className="text-sm text-gray-600 ml-1">
                  {labels[existingReview?.rating ?? rating]}
                </span>
              </div>
              {existingReview?.comment && (
                <p className="text-sm text-gray-600 italic">"{existingReview.comment}"</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="flex-shrink-0 gap-1.5 text-xs"
          >
            <Pencil size={12} />
            Editar
          </Button>
        </div>
      </Card>
    );
  }

  // ── Rating form ──────────────────────────────────────────────────────────
  return (
    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          ¿Cómo calificarías este curso?
        </h3>
        <p className="text-sm text-gray-500">
          Tu opinión ayuda al instructor a mejorar y a otros estudiantes a decidir.
        </p>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={36}
              className={`transition-colors ${
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="ml-2 text-sm font-semibold text-yellow-700">
            {labels[displayRating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comparte tu experiencia con este curso (opcional)..."
        rows={3}
        className="w-full mt-3 px-3 py-2 text-sm border border-yellow-200 rounded-lg bg-white/70 
                   focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                   placeholder:text-gray-400 resize-none"
      />

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          size="sm"
          className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
        >
          {submitting ? (
            "Enviando..."
          ) : (
            <>
              <Send size={14} />
              {existingReview ? "Actualizar reseña" : "Enviar reseña"}
            </>
          )}
        </Button>
        {editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(false);
              setRating(existingReview?.rating ?? 0);
              setComment(existingReview?.comment ?? "");
            }}
          >
            Cancelar
          </Button>
        )}
        {rating === 0 && (
          <span className="text-xs text-gray-400">Selecciona al menos una estrella</span>
        )}
      </div>
    </Card>
  );
}