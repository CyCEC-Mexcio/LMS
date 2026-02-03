"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type PublishToggleProps = {
  courseId: string;
  isPublished: boolean;
  isApproved: boolean;
};

export default function PublishToggle({
  courseId,
  isPublished,
  isApproved,
}: PublishToggleProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(isPublished);

  const handleToggle = async () => {
    if (!isApproved) {
      alert("Este curso debe ser aprobado antes de publicarlo");
      return;
    }

    setLoading(true);
    try {
      const newState = !published;

      const { error } = await supabase
        .from("courses")
        .update({ is_published: newState })
        .eq("id", courseId);

      if (error) throw error;

      setPublished(newState);
      router.refresh();
    } catch (error) {
      console.error("Error toggling publish:", error);
      alert("Error al cambiar el estado de publicación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading || !isApproved}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        published
          ? "bg-green-600"
          : isApproved
          ? "bg-gray-200"
          : "bg-gray-100 cursor-not-allowed"
      }`}
      title={
        !isApproved
          ? "Debe ser aprobado primero"
          : published
          ? "Publicado - Click para despublicar"
          : "No publicado - Click para publicar"
      }
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          published ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}