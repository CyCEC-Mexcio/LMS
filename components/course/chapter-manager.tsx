"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  ClipboardCheck,
} from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  position: number;
  duration_minutes: number | null;
  is_free_preview: boolean;
  video_url: string | null;
  has_quiz: boolean;
};

type Section = {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};

type ChapterManagerProps = {
  courseId: string;
  isAdmin?: boolean;
};

export default function ChapterManager({
  courseId,
  isAdmin = false,
}: ChapterManagerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [sections, setSections] = useState<Section[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");

  useEffect(() => {
    fetchSections();
  }, [courseId]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sections")
        .select(
          `
          id,
          title,
          position,
          lessons (
            id,
            title,
            position,
            duration_minutes,
            is_free_preview,
            video_url,
            has_quiz
          )
        `
        )
        .eq("course_id", courseId)
        .order("position", { ascending: true });

      if (error) throw error;

      const sectionsWithSortedLessons = data.map((section: any) => ({
        ...section,
        lessons: section.lessons.sort(
          (a: Lesson, b: Lesson) => a.position - b.position
        ),
      }));

      setSections(sectionsWithSortedLessons || []);
    } catch (error) {
      console.error("Error fetching sections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;

    try {
      const newPosition = sections.length + 1;

      const { data, error } = await supabase
        .from("sections")
        .insert({
          course_id: courseId,
          title: newSectionTitle,
          position: newPosition,
        })
        .select()
        .single();

      if (error) throw error;

      setSections([...sections, { ...data, lessons: [] }]);
      setNewSectionTitle("");
      setAddingSection(false);
    } catch (error) {
      console.error("Error creating section:", error);
      alert("Error al crear capítulo");
    }
  };

  const handleUpdateSection = async (sectionId: string) => {
    if (!editSectionTitle.trim()) return;

    try {
      const { error } = await supabase
        .from("sections")
        .update({ title: editSectionTitle })
        .eq("id", sectionId);

      if (error) throw error;

      setSections(
        sections.map((s) =>
          s.id === sectionId ? { ...s, title: editSectionTitle } : s
        )
      );
      setEditingSectionId(null);
      setEditSectionTitle("");
    } catch (error) {
      console.error("Error updating section:", error);
      alert("Error al actualizar capítulo");
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("¿Estás seguro de eliminar este capítulo y todas sus lecciones?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;

      setSections(sections.filter((s) => s.id !== sectionId));
    } catch (error) {
      console.error("Error deleting section:", error);
      alert("Error al eliminar capítulo");
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleAddLesson = (sectionId: string) => {
    const basePath = isAdmin ? "/admin" : "/teacher";
    router.push(`${basePath}/courses/${courseId}/chapters/new?sectionId=${sectionId}`);
  };

  const handleEditLesson = (sectionId: string, lessonId: string) => {
    const basePath = isAdmin ? "/admin" : "/teacher";
    router.push(`${basePath}/courses/${courseId}/chapters/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando capítulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gestionar Capítulos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Organiza tu curso en secciones y lecciones
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Volver al Curso
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Sections List */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="bg-card rounded-lg border border-border overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 p-4 bg-muted/30">
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  
                  {editingSectionId === section.id ? (
                    <Input
                      value={editSectionTitle}
                      onChange={(e) => setEditSectionTitle(e.target.value)}
                      onBlur={() => handleUpdateSection(section.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateSection(section.id);
                        if (e.key === "Escape") {
                          setEditingSectionId(null);
                          setEditSectionTitle("");
                        }
                      }}
                      autoFocus
                      className="flex-1"
                    />
                  ) : (
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        Capítulo {index + 1}: {section.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {section.lessons.length} lecciones
                      </p>
                    </div>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const basePath = isAdmin ? "/admin" : "/teacher";
                      router.push(
                        `${basePath}/courses/${courseId}/chapters/${section.id}/lessons/new`
                      );
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Lesson
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSectionId(section.id);
                      setEditSectionTitle(section.title);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

              </div>

              {/* Lessons List */}
              {expandedSections.has(section.id) && (
                <div className="p-4 space-y-2">
                  {section.lessons.length > 0 ? (
                    section.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleEditLesson(section.id, lesson.id)}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-foreground">
                            {lessonIndex + 1}. {lesson.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            {lesson.video_url && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Video
                              </span>
                            )}
                            {lesson.has_quiz && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ClipboardCheck className="w-3 h-3" />
                                Quiz
                              </span>
                            )}
                            {lesson.duration_minutes && (
                              <span className="text-xs text-muted-foreground">
                                {lesson.duration_minutes} min
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {lesson.is_free_preview && (
                            <Badge variant="outline" className="text-xs">
                              Vista Previa
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay lecciones en este capítulo
                    </p>
                  )}

                  {/* Add Lesson Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAddLesson(section.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Lección
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Add New Section */}
          {addingSection ? (
            <div className="bg-card rounded-lg border border-border p-4">
              <Input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Nombre del capítulo (ej: Introducción, Fundamentos, etc.)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSection();
                  if (e.key === "Escape") {
                    setAddingSection(false);
                    setNewSectionTitle("");
                  }
                }}
                autoFocus
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateSection}>Crear Capítulo</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddingSection(false);
                    setNewSectionTitle("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAddingSection(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Capítulo
            </Button>
          )}
        </div>

        {sections.length === 0 && !addingSection && (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay capítulos aún
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Comienza creando el primer capítulo de tu curso
            </p>
            <Button onClick={() => setAddingSection(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Capítulo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}