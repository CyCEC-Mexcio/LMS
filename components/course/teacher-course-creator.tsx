"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  LayoutGrid,
  ListChecks,
  DollarSign,
  Paperclip,
  AlertCircle,
} from "lucide-react";

export default function TeacherCourseCreator() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    organization: "",
    instructor_name: "",
    category: "",
    level: "beginner",
    price: 0,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    "Programación",
    "Diseño",
    "Negocios",
    "Marketing",
    "Finanzas",
    "Desarrollo Personal",
    "Salud y Bienestar",
    "Idiomas",
    "Música",
    "Fotografía",
  ];

  const handleThumbnailUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("course-assets")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("course-assets").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let thumbnailUrl = null;

      if (thumbnailFile) {
        console.log("Uploading thumbnail...");
        thumbnailUrl = await handleThumbnailUpload(thumbnailFile);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No autenticado");

      console.log("Creating course as teacher:", user.id);

      const slug = formData.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const courseData = {
        title: formData.title,
        description: formData.description,
        organization: formData.organization || null,
        instructor_name: formData.instructor_name,
        category: formData.category,
        level: formData.level,
        thumbnail_url: thumbnailUrl,
        price: formData.price,
        currency: "MXN",
        slug: slug,
        teacher_id: user.id,
        is_approved: false, // Teachers need admin approval
        is_published: false,
      };

      console.log("Inserting course:", courseData);

      const { data: newCourse, error: insertError } = await supabase
        .from("courses")
        .insert([courseData])
        .select()
        .single();

      console.log("Insert result:", newCourse);
      console.log("Insert error:", insertError);

      if (insertError) throw insertError;

      console.log("Course created, redirecting to:", `/teacher/courses/${newCourse.id}`);

      router.push(`/teacher/courses/${newCourse.id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error creating course:", err);
      setError(err.message || "Error al crear el curso");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.title &&
    formData.description &&
    formData.instructor_name &&
    formData.category;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header with Teacher Note */}
      <div className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">
                Crear Curso (Instructor)
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Tu curso será enviado para aprobación del administrador antes de poder publicarse.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleCreateCourse}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <LayoutGrid className="w-5 h-5 text-sky-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Información Básica
                </h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Title */}
              <div className="bg-card rounded-lg border border-border p-5">
                <Label htmlFor="title" className="text-sm font-medium text-muted-foreground">
                  Título del Curso *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ej: Introducción a Python"
                  required
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div className="bg-card rounded-lg border border-border p-5">
                <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                  Descripción del Curso *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe de qué trata el curso..."
                  required
                  disabled={loading}
                  rows={5}
                  className="mt-2"
                />
              </div>

              {/* Organization & Instructor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-lg border border-border p-5">
                  <Label htmlFor="organization" className="text-sm font-medium text-muted-foreground">
                    Organización
                  </Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData({ ...formData, organization: e.target.value })
                    }
                    placeholder="Ej: Google"
                    disabled={loading}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Opcional</p>
                </div>

                <div className="bg-card rounded-lg border border-border p-5">
                  <Label htmlFor="instructor_name" className="text-sm font-medium text-muted-foreground">
                    Instructor *
                  </Label>
                  <Input
                    id="instructor_name"
                    value={formData.instructor_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instructor_name: e.target.value,
                      })
                    }
                    placeholder="Nombre completo"
                    required
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div className="bg-card rounded-lg border border-border p-5">
                <Label htmlFor="thumbnail" className="text-sm font-medium text-muted-foreground">
                  Imagen de Portada
                </Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setThumbnailFile(file);
                  }}
                  disabled={loading}
                  className="mt-2"
                />
                {thumbnailFile && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ {thumbnailFile.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 1280x720px (16:9)
                </p>
              </div>
            </div>

            {/* Right Column - Course Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <ListChecks className="w-5 h-5 text-sky-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Detalles del Curso
                </h2>
              </div>

              {/* Category & Level */}
              <div className="bg-card rounded-lg border border-border p-5 space-y-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-muted-foreground">
                    Categoría *
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                    disabled={loading}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="level" className="text-sm font-medium text-muted-foreground">
                    Nivel *
                  </Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value })
                    }
                    required
                    disabled={loading}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-sky-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Precio
                  </h2>
                </div>

                <div className="bg-card rounded-lg border border-border p-5">
                  <Label htmlFor="price" className="text-sm font-medium text-muted-foreground">
                    Precio del Curso (MXN)
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      min="0"
                      step="0.01"
                      disabled={loading}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">MXN</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Puedes cambiarlo después
                  </p>
                </div>
              </div>

              {/* Next Steps Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <Paperclip className="w-5 h-5 text-sky-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Siguiente Paso
                  </h2>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-5">
                  <h3 className="font-medium text-sky-900 mb-2">
                    Después de crear el curso podrás:
                  </h3>
                  <ul className="text-sm text-sky-800 space-y-1">
                    <li>✓ Agregar capítulos y lecciones</li>
                    <li>✓ Subir videos (YouTube, Mux o código embed)</li>
                    <li>✓ Crear quizzes para cada lección</li>
                    <li>✓ Añadir recursos y archivos adjuntos</li>
                    <li>✓ Enviar para aprobación del administrador</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 justify-end border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? "Creando..." : "Crear Curso"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}