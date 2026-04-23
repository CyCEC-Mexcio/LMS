"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

import {
  Video,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Save,
  Trash2,
  Plus,
  GripVertical,
  X,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  Link2,
  Upload,
  CheckCircle,
  AlertCircle,
  Code,
  Eye,
  Heading1,
  Heading2,
  List,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LessonEditorProps {
  courseId: string;
  chapterId: string;
  lessonId?: string;
  isAdmin: boolean;
}

type ModuleType = "video" | "content" | "quiz" | "link";

interface BaseModule {
  id: string;
  type: ModuleType;
  position: number;
}

interface VideoModule extends BaseModule {
  type: "video";
  provider: "youtube" | "mux" | "embed" | "google_drive" | "onedrive" | null;
  youtube_url: string;
  mux_playback_id: string;
  mux_asset_id: string;
  embed_code: string;
  google_drive_url: string;
  onedrive_url: string;
}

interface ContentModule extends BaseModule {
  type: "content";
  content: string;
}

interface QuizModule extends BaseModule {
  type: "quiz";
  title: string;
  passing_score: number;
  questions: QuizQuestion[];
}

interface LinkModule extends BaseModule {
  type: "link";
  title: string;
  url: string;
  description: string;
}

type Module = VideoModule | ContentModule | QuizModule | LinkModule;

interface QuizQuestion {
  id: string;
  question: string;
  question_type: "single_choice" | "multiple_choice" | "true_false";
  options: string[];
  correct_answer: string | string[]; // string for single/true_false, array for multiple
  explanation: string;
}

export default function ModularLessonEditor({
  courseId,
  chapterId,
  lessonId,
  isAdmin,
}: LessonEditorProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  }, []);
  const [sectionTitle, setSectionTitle] = useState("");
  
  // Lesson basic info
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [isFreePreview, setIsFreePreview] = useState(false);
  
  // Modules
  const [modules, setModules] = useState<Module[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  
  // Delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    moduleId?: string;
    isLesson?: boolean;
  }>({ open: false });

  useEffect(() => {
    loadData();
  }, [lessonId, chapterId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load section title
      const { data: sectionData } = await supabase
        .from("sections")
        .select("title")
        .eq("id", chapterId)
        .single();

      if (sectionData) {
        setSectionTitle(sectionData.title);
      }

      if (lessonId && lessonId !== "new") {
        // Load existing lesson
        const { data: lesson, error } = await supabase
          .from("lessons")
          .select("*")
          .eq("id", lessonId)
          .single();

        if (error) throw error;

        if (lesson) {
          setLessonTitle(lesson.title);
          setLessonDescription(lesson.description || "");
          setDurationMinutes(lesson.duration_minutes);
          setIsFreePreview(lesson.is_free_preview);

          // Parse modules from lesson data
          const parsedModules: Module[] = [];
          let position = 0;

          // Add video module if exists
          if (lesson.video_provider) {
            parsedModules.push({
              id: `video-${Date.now()}`,
              type: "video",
              position: position++,
              provider: lesson.video_provider,
              youtube_url: lesson.youtube_url || "",
              mux_playback_id: lesson.mux_playback_id || "",
              mux_asset_id: "",
              embed_code: lesson.embed_code || "",
              google_drive_url: lesson.video_provider === "google_drive" ? (lesson.video_url || "") : "",
              onedrive_url: lesson.video_provider === "onedrive" ? (lesson.video_url || "") : "",
            });
          }

          // Add content module if exists
          if (lesson.content) {
            parsedModules.push({
              id: `content-${Date.now()}`,
              type: "content",
              position: position++,
              content: lesson.content,
            });
          }

          // Load quiz if exists
          if (lesson.has_quiz) {
            const { data: quiz } = await supabase
              .from("quizzes")
              .select(`*, quiz_questions (*)`)
              .eq("lesson_id", lessonId)
              .single();

            if (quiz) {
              const questions = quiz.quiz_questions
                .sort((a: any, b: any) => a.position - b.position)
                .map((q: any) => ({
                  ...q,
                  question_type: q.question_type === "multiple_choice" 
                    ? (Array.isArray(q.correct_answer) ? "multiple_choice" : "single_choice")
                    : q.question_type,
                }));

              parsedModules.push({
                id: `quiz-${quiz.id}`,
                type: "quiz",
                position: position++,
                title: quiz.title,
                passing_score: quiz.passing_score,
                questions,
              });
            }
          }

          // Load resources/links if exists
          if (lesson.resources) {
            const resources = Array.isArray(lesson.resources)
              ? lesson.resources
              : [];
            resources.forEach((resource: any) => {
              if (resource.type === "link") {
                parsedModules.push({
                  id: resource.id || `link-${Date.now()}-${Math.random()}`,
                  type: "link",
                  position: position++,
                  title: resource.title,
                  url: resource.url,
                  description: resource.description || "",
                });
              }
            });
          }

          setModules(parsedModules);
        }
      }
    } catch (error) {
      console.error("Error loading lesson:", error);
      showToast("Error al cargar la lección", "error");
    } finally {
      setLoading(false);
    }
  };

  const addModule = (type: ModuleType) => {
    const newModule: Module = {
      id: `${type}-${Date.now()}`,
      type,
      position: modules.length,
    } as any;

    if (type === "video") {
      (newModule as VideoModule).provider = null;
      (newModule as VideoModule).youtube_url = "";
      (newModule as VideoModule).mux_playback_id = "";
      (newModule as VideoModule).mux_asset_id = "";
      (newModule as VideoModule).embed_code = "";
      (newModule as VideoModule).google_drive_url = "";
      (newModule as VideoModule).onedrive_url = "";
    } else if (type === "content") {
      (newModule as ContentModule).content = "";
    } else if (type === "quiz") {
      (newModule as QuizModule).title = "Quiz";
      (newModule as QuizModule).passing_score = 70;
      (newModule as QuizModule).questions = [];
    } else if (type === "link") {
      (newModule as LinkModule).title = "";
      (newModule as LinkModule).url = "";
      (newModule as LinkModule).description = "";
    }

    setModules([...modules, newModule]);
    setShowAddMenu(false);
  };

  const updateModule = (id: string, updates: Partial<Module>) => {
   setModules(
      modules.map((module) =>
        module.id === id ? { ...module, ...updates } as Module : module
      )
    );
  };

  const deleteModule = (id: string) => {
    setDeleteConfirmation({ open: true, moduleId: id });
  };

  const confirmDeleteModule = () => {
    if (deleteConfirmation.moduleId) {
      setModules(modules.filter((m) => m.id !== deleteConfirmation.moduleId));
    }
    setDeleteConfirmation({ open: false });
  };

  const moveModule = (id: string, direction: "up" | "down") => {
    const index = modules.findIndex((m) => m.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === modules.length - 1)
    ) {
      return;
    }

    const newModules = [...modules];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newModules[index], newModules[newIndex]] = [
      newModules[newIndex],
      newModules[index],
    ];

    // Update positions
    newModules.forEach((m, i) => (m.position = i));
    setModules(newModules);
  };

  // Drag and drop handlers
  const handleDragStart = (id: string) => {
    setDraggedModule(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedModule || draggedModule === targetId) return;

    const draggedIndex = modules.findIndex((m) => m.id === draggedModule);
    const targetIndex = modules.findIndex((m) => m.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newModules = [...modules];
    const [removed] = newModules.splice(draggedIndex, 1);
    newModules.splice(targetIndex, 0, removed);

    newModules.forEach((m, i) => (m.position = i));
    setModules(newModules);
  };

  const handleDrop = () => {
    setDraggedModule(null);
  };

  const handleSave = async () => {
    if (!lessonTitle.trim()) {
      showToast("Por favor ingresa un título para la lección", "error");
      return;
    }

    setSaving(true);
    try {
      // Prepare lesson data
      const videoModule = modules.find((m) => m.type === "video") as VideoModule;
      const contentModule = modules.find((m) => m.type === "content") as ContentModule;
      const quizModule = modules.find((m) => m.type === "quiz") as QuizModule;
      const linkModules = modules.filter((m) => m.type === "link") as LinkModule[];

      const lessonData = {
        title: lessonTitle,
        description: lessonDescription || null,
        duration_minutes: durationMinutes,
        is_free_preview: isFreePreview,
        video_provider: videoModule?.provider || null,
        youtube_url: videoModule?.youtube_url || null,
        mux_playback_id: videoModule?.mux_playback_id || null,
        embed_code: videoModule?.embed_code || null,
        video_url: videoModule?.google_drive_url || videoModule?.onedrive_url || null,
        content: contentModule?.content || null,
        has_quiz: !!quizModule,
        resources: linkModules.map((link) => ({
          id: link.id,
          type: "link",
          title: link.title,
          url: link.url,
          description: link.description,
        })),
      };

       let savedLessonId = lessonId && lessonId !== "new" ? lessonId : undefined;

      // Save lesson
      if (lessonId && lessonId !== "new") {
        const { error } = await supabase
          .from("lessons")
          .update({ ...lessonData, updated_at: new Date().toISOString() })
          .eq("id", lessonId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("lessons")
          .insert({
            section_id: chapterId,
            position: 0,
            ...lessonData,
          })
          .select()
          .single();

        if (error) throw error;
        savedLessonId = data.id;
      }

      // Save quiz if exists
      if (quizModule && savedLessonId) {
        // Delete existing quiz and questions
        const { data: existingQuiz } = await supabase
          .from("quizzes")
          .select("id")
          .eq("lesson_id", savedLessonId)
          .single();

        if (existingQuiz) {
          await supabase
            .from("quiz_questions")
            .delete()
            .eq("quiz_id", existingQuiz.id);
          await supabase.from("quizzes").delete().eq("id", existingQuiz.id);
        }

        // Create new quiz
        const { data: newQuiz, error: quizError } = await supabase
          .from("quizzes")
          .insert({
            lesson_id: savedLessonId,
            title: quizModule.title,
            passing_score: quizModule.passing_score,
          })
          .select()
          .single();

        if (quizError) throw quizError;

        // Insert questions
        if (quizModule.questions.length > 0) {
          const questionsToInsert = quizModule.questions.map((q, index) => ({
            quiz_id: newQuiz.id,
            question: q.question,
            question_type: q.question_type === "single_choice" ? "multiple_choice" : q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            position: index,
          }));

          const { error: questionsError } = await supabase
            .from("quiz_questions")
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
        }
      }

      showToast("¡Lección guardada exitosamente!", "success");
      const basePath = isAdmin ? "/admin" : "/teacher";
      setTimeout(() => {
        router.push(`${basePath}/courses/${courseId}`);
      }, 1200);
    } catch (error) {
      console.error("Error saving lesson:", error);
      showToast("Error al guardar la lección", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteConfirmation({ open: true, isLesson: true });
  };

  const confirmDeleteLesson = async () => {
    if (!lessonId || lessonId === "new") return;

    try {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

      if (error) throw error;

      showToast("Lección eliminada exitosamente", "success");
      const basePath = isAdmin ? "/admin" : "/teacher";
      setTimeout(() => {
        router.push(`${basePath}/courses/${courseId}`);
      }, 1200);
    } catch (error) {
      console.error("Error deleting lesson:", error);
      showToast("Error al eliminar la lección", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {lessonId ? "Editar Lección" : "Crear Nueva Lección"}
              </h1>
              <p className="text-gray-600 mt-1">
                Capítulo: <span className="font-medium">{sectionTitle}</span>
              </p>
            </div>
            <div className="flex gap-3">
              {lessonId && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !lessonTitle}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>

        {/* Lesson Basic Info */}
        <Card className="p-6 mb-6 border-2 border-purple-100 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Información Básica</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título de la Lección *</Label>
              <Input
                id="title"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="ej. Introducción a Variables"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción Breve</Label>
              <Textarea
                id="description"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Resumen de lo que aprenderán los estudiantes..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={durationMinutes || ""}
                  onChange={(e) =>
                    setDurationMinutes(e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="15"
                  className="mt-1"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFreePreview}
                    onChange={(e) => setIsFreePreview(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Vista Previa Gratuita
                  </span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Modules */}
        <div className="space-y-4">
          {modules.map((module, index) => (
            <div
              key={module.id}
              onDragOver={(e) => handleDragOver(e, module.id)}
              onDrop={handleDrop}
              className={`transition-all ${
                draggedModule === module.id ? "opacity-50" : ""
              }`}
            >
              <Card className="p-6 border-2 border-gray-200 hover:border-purple-300 transition-colors">
                {/* Module Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      draggable
                      onDragStart={() => handleDragStart(module.id)}
                      className="cursor-move select-none p-1 rounded hover:bg-gray-100 transition-colors"
                      title="Arrastra para reordenar"
                    >
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {module.type === "video" && (
                        <>
                          <Video className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-gray-900">Módulo de Video</span>
                        </>
                      )}
                      {module.type === "content" && (
                        <>
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-900">Contenido</span>
                        </>
                      )}
                      {module.type === "quiz" && (
                        <>
                          <HelpCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-gray-900">Quiz</span>
                        </>
                      )}
                      {module.type === "link" && (
                        <>
                          <LinkIcon className="w-5 h-5 text-orange-600" />
                          <span className="font-medium text-gray-900">Enlace</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveModule(module.id, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveModule(module.id, "down")}
                      disabled={index === modules.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteModule(module.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Module Content */}
                {module.type === "video" && (
                  <VideoModuleEditor
                    module={module as VideoModule}
                    onChange={(updates) => updateModule(module.id, updates)}
                  />
                )}
                {module.type === "content" && (
                  <ContentModuleEditor
                    module={module as ContentModule}
                    onChange={(updates) => updateModule(module.id, updates)}
                  />
                )}
                {module.type === "quiz" && (
                  <QuizModuleEditor
                    module={module as QuizModule}
                    onChange={(updates) => updateModule(module.id, updates)}
                  />
                )}
                {module.type === "link" && (
                  <LinkModuleEditor
                    module={module as LinkModule}
                    onChange={(updates) => updateModule(module.id, updates)}
                  />
                )}
              </Card>
            </div>
          ))}
        </div>

        {/* Add Module Button */}
        <div className="mt-6">
          {!showAddMenu ? (
            <Button
              onClick={() => setShowAddMenu(true)}
              variant="outline"
              className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 h-16 text-purple-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Agregar Módulo
            </Button>
          ) : (
            <Card className="p-4 border-2 border-purple-200">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Selecciona el tipo de módulo:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => addModule("video")}
                  className="h-20 flex flex-col hover:bg-purple-50 hover:border-purple-300"
                >
                  <Video className="w-6 h-6 mb-2 text-purple-600" />
                  <span>Video</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addModule("content")}
                  className="h-20 flex flex-col hover:bg-blue-50 hover:border-blue-300"
                >
                  <FileText className="w-6 h-6 mb-2 text-blue-600" />
                  <span>Contenido</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addModule("quiz")}
                  className="h-20 flex flex-col hover:bg-green-50 hover:border-green-300"
                >
                  <HelpCircle className="w-6 h-6 mb-2 text-green-600" />
                  <span>Quiz</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addModule("link")}
                  className="h-20 flex flex-col hover:bg-orange-50 hover:border-orange-300"
                >
                  <LinkIcon className="w-6 h-6 mb-2 text-orange-600" />
                  <span>Enlace</span>
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowAddMenu(false)}
                className="w-full mt-3"
              >
                Cancelar
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmation.open} onOpenChange={(open) => setDeleteConfirmation({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation.isLesson 
                ? "Esta acción eliminará permanentemente la lección completa y todos sus módulos. Esta acción no se puede deshacer."
                : "Esta acción eliminará permanentemente este módulo. Esta acción no se puede deshacer."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteConfirmation.isLesson ? confirmDeleteLesson : confirmDeleteModule}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Animated Toast Notification */}
      <div
        className={`fixed top-6 right-6 z-[9999] transition-all duration-500 ease-out ${
          toast.show
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-4 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div
          className={`relative flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-sm border min-w-[320px] ${
            toast.type === "success"
              ? "bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-400/30 text-white"
              : "bg-gradient-to-r from-red-500/90 to-rose-500/90 border-red-400/30 text-white"
          }`}
          style={{
            boxShadow:
              toast.type === "success"
                ? "0 20px 60px -12px rgba(16, 185, 129, 0.4)"
                : "0 20px 60px -12px rgba(239, 68, 68, 0.4)",
          }}
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/20">
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/80" />
          </button>
          {/* Progress bar */}
          {toast.show && (
            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden">
              <div
                className="h-full bg-white/30 rounded-b-xl"
                style={{
                  animation: "toast-progress 3.5s linear forwards",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Toast progress bar animation */}
      <style jsx>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

// Module Editors
function VideoModuleEditor({
  module,
  onChange,
}: {
  module: VideoModule;
  onChange: (updates: Partial<VideoModule>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "ready" | "error">("idle");

  const handleMuxUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadStatus("uploading");
      setUploadProgress(0);

      // Create upload URL
      const createResponse = await fetch("/api/mux/create-upload", {
        method: "POST",
      });

      if (!createResponse.ok) throw new Error("Failed to create upload URL");

      const { uploadUrl, uploadId } = await createResponse.json();

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      await new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("PUT", uploadUrl);
        xhr.send(file);
      });

      setUploadStatus("processing");
      setUploadProgress(100);

      // Poll for asset readiness
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      const checkStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error("Upload processing timeout");
        }

        const checkResponse = await fetch(`/api/mux/check-upload?uploadId=${uploadId}`);
        const { status, playbackId, assetId } = await checkResponse.json();

        if (status === "ready" && playbackId) {
          onChange({
            provider: "mux",
            mux_playback_id: playbackId,
            mux_asset_id: assetId,
          });
          setUploadStatus("ready");
          return;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        return checkStatus();
      };

      await checkStatus();

    } catch (error) {
      console.error("Error uploading to Mux:", error);
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Proveedor de Video</Label>
        <Select
          value={module.provider || "none"}
          onValueChange={(value) =>
            onChange({ provider: value === "none" ? null : (value as any) })
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecciona proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin Video</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="mux">Mux (Subir Video)</SelectItem>
            <SelectItem value="google_drive">Google Drive</SelectItem>
            <SelectItem value="onedrive">OneDrive</SelectItem>
            <SelectItem value="embed">Código Embebido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {module.provider === "youtube" && (
        <div>
          <Label>URL de YouTube</Label>
          <Input
            value={module.youtube_url}
            onChange={(e) => onChange({ youtube_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="mt-1"
          />
        </div>
      )}

      {module.provider === "mux" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Recomendaciones para mejor calidad:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Videos de máximo 5-10 minutos para mejor experiencia</li>
                  <li>Formato MP4 con resolución 1080p o inferior</li>
                  <li>Tamaño recomendado: menor a 500MB</li>
                </ul>
              </div>
            </div>
          </div>

          {!module.mux_playback_id ? (
            <div>
              <Label>Subir Video</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMuxUpload(file);
                  }}
                  disabled={uploading}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="w-full"
                    onClick={() => document.getElementById("video-upload")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Subiendo..." : "Seleccionar Video"}
                  </Button>
                </label>
              </div>

              {uploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      {uploadStatus === "uploading" && "Subiendo video..."}
                      {uploadStatus === "processing" && "Procesando video..."}
                    </span>
                    <span className="text-gray-600">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadStatus === "error" && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-800">
                      Error al subir el video. Por favor intenta de nuevo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Video subido exitosamente</p>
                  <p className="text-xs text-green-700 mt-1">Playback ID: {module.mux_playback_id}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange({ mux_playback_id: "", mux_asset_id: "" })}
                  className="text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {module.provider === "google_drive" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Cómo compartir un video de Google Drive:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Abre el video en Google Drive</li>
                  <li>Haz clic en <strong>Compartir</strong> y cambia el acceso a <strong>&quot;Cualquier persona con el enlace&quot;</strong></li>
                  <li>Copia el enlace y pégalo aquí</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <Label>Enlace de Google Drive</Label>
            <Input
              value={module.google_drive_url}
              onChange={(e) => onChange({ google_drive_url: e.target.value })}
              placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              className="mt-1"
            />
          </div>

          {module.google_drive_url && (() => {
            const match = module.google_drive_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            const fileId = match?.[1];
            if (fileId) {
              return (
                <div className="mt-3">
                  <Label className="text-sm text-gray-600 mb-2 block">Vista Previa</Label>
                  <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-300">
                    <iframe
                      src={`https://drive.google.com/file/d/${fileId}/preview`}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            }
            return (
              <p className="text-sm text-red-600 mt-1">
                No se pudo extraer el ID del archivo. Asegúrate de que el enlace sea válido.
              </p>
            );
          })()}
        </div>
      )}

      {module.provider === "onedrive" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Cómo compartir un video de OneDrive:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Abre el video en OneDrive</li>
                  <li>Haz clic en <strong>Compartir</strong> → <strong>Cualquier persona con el vínculo</strong></li>
                  <li>Copia el enlace y pégalo aquí</li>
                </ol>
                <p className="mt-2 text-blue-600 text-xs">
                  Acepta enlaces cortos (1drv.ms), enlaces completos de OneDrive, y URLs de inserción (embed).
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label>Enlace de OneDrive</Label>
            <Input
              value={module.onedrive_url}
              onChange={(e) => onChange({ onedrive_url: e.target.value })}
              placeholder="https://onedrive.live.com/... o https://1drv.ms/v/..."
              className="mt-1"
            />
          </div>

          {module.onedrive_url && (() => {
            const url = module.onedrive_url.trim();

            /**
             * Converts any OneDrive share URL into an embeddable URL.
             * Supports:
             * - Already-embed URLs (passthrough)
             * - 1drv.ms short links (base64 encode trick)
             * - onedrive.live.com share/redir/view URLs
             * - sharepoint.com URLs
             */
            const getOnedriveEmbedUrl = (rawUrl: string): { embedUrl: string | null; error: string | null } => {
              // 1. Already an embed URL — use as-is
              if (rawUrl.includes("/embed")) {
                return { embedUrl: rawUrl, error: null };
              }

              // 2. Extract src from a pasted <iframe> tag
              const iframeMatch = rawUrl.match(/src=["']([^"']+)["']/);
              if (iframeMatch) {
                return { embedUrl: iframeMatch[1], error: null };
              }

              // 3. 1drv.ms short links — convert using Microsoft's base64 method
              if (rawUrl.includes("1drv.ms")) {
                try {
                  // Microsoft documented approach: base64-encode the share URL,
                  // replace / with _, + with -, trim trailing =, prepend 'u!'
                  const base64 = btoa(rawUrl)
                    .replace(/\//g, "_")
                    .replace(/\+/g, "-")
                    .replace(/=+$/, "");
                  const apiUrl = `https://api.onedrive.com/v1.0/shares/u!${base64}/root`;
                  // Construct an embed URL via the OneDrive web embed endpoint
                  const embedUrl = `https://onedrive.live.com/embed?resid=u!${base64}&authkey=`;
                  // Alternative: direct download-as-embed (more reliable for video playback)
                  const directEmbedUrl = `https://api.onedrive.com/v1.0/shares/u!${base64}/root/content`;
                  return { embedUrl: directEmbedUrl, error: null };
                } catch {
                  return { embedUrl: null, error: "No se pudo convertir el enlace corto. Verifica que sea un enlace válido de OneDrive." };
                }
              }

              // 4. onedrive.live.com or sharepoint.com share URLs
              if (rawUrl.includes("onedrive.live.com") || rawUrl.includes("sharepoint.com")) {
                const embedUrl = rawUrl
                  .replace("redir?", "embed?")
                  .replace("/view.aspx?", "/embed?")
                  .replace("?view=true", "?action=embedview");
                return { embedUrl, error: null };
              }

              return { embedUrl: null, error: "Formato de URL no reconocido. Usa un enlace de OneDrive, un enlace corto (1drv.ms), o una URL de inserción." };
            };

            const { embedUrl, error } = getOnedriveEmbedUrl(url);

            if (error) {
              return (
                <div className="mt-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {error}
                    </p>
                  </div>
                </div>
              );
            }

            if (embedUrl) {
              return (
                <div className="mt-3">
                  <Label className="text-sm text-gray-600 mb-2 block">Vista Previa</Label>
                  <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-300">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                  {url.includes("1drv.ms") && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Enlace corto convertido automáticamente.
                    </p>
                  )}
                  <p className="text-xs text-amber-600 mt-1">
                    Si no se muestra la vista previa, verifica que el archivo esté compartido como <strong>&quot;Cualquier persona con el vínculo&quot;</strong>.
                  </p>
                </div>
              );
            }

            return null;
          })()}
        </div>
      )}

      {module.provider === "embed" && (
        <div>
          <Label>Código Embebido</Label>
          <Textarea
            value={module.embed_code}
            onChange={(e) => onChange({ embed_code: e.target.value })}
            placeholder='<iframe src="..." ...></iframe>'
            className="mt-1"
            rows={4}
          />
        </div>
      )}
    </div>
  );
}

function ContentModuleEditor({
  module,
  onChange,
}: {
  module: ContentModule;
  onChange: (updates: Partial<ContentModule>) => void;
}) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [editorMode, setEditorMode] = useState<"text" | "html" | "preview">("text");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Save selection whenever user interacts with textarea
  const saveSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      selectionRef.current = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      };
    }
  }, []);

  const insertFormatting = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end } = selectionRef.current;
    const content = module.content;
    const selectedText = content.substring(start, end);
    const placeholder = selectedText || "texto";
    const newText =
      content.substring(0, start) +
      before +
      placeholder +
      after +
      content.substring(end);

    onChange({ content: newText });

    // Position cursor inside the formatting marks
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        // Keep the formatted text selected
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      } else {
        // Select the placeholder so user can type over it
        textarea.setSelectionRange(start + before.length, start + before.length + placeholder.length);
      }
    }, 0);
  }, [module.content, onChange]);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end } = selectionRef.current;
    const content = module.content;
    const newText =
      content.substring(0, start) +
      text +
      content.substring(end);

    onChange({ content: newText });

    setTimeout(() => {
      textarea.focus();
      const newPos = start + text.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [module.content, onChange]);

  const handleInsertLink = () => {
    if (!linkUrl) return;

    const displayText = linkText || linkUrl;
    const linkMarkdown = `[${displayText}](${linkUrl})`;
    insertAtCursor(linkMarkdown);

    setShowLinkDialog(false);
    setLinkText("");
    setLinkUrl("");
  };

  const openLinkDialog = useCallback(() => {
    // Pre-fill link text with selected text
    const textarea = textareaRef.current;
    if (textarea) {
      const { start, end } = selectionRef.current;
      const selected = module.content.substring(start, end);
      if (selected) {
        setLinkText(selected);
      }
    }
    setShowLinkDialog(true);
  }, [module.content]);

  // Render preview HTML from content
  const previewHtml = useCallback((content: string) => {
    // If it looks like HTML, render directly
    if (content.trim().startsWith("<")) {
      return content;
    }
    // Otherwise convert markdown-like text to HTML
    let html = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    );
    html = html.replace(/^## (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    html = html.replace(/\n/g, "<br />");
    return html;
  }, []);

  // Toolbar button helper — uses onMouseDown + preventDefault to keep textarea selection
  const ToolbarBtn = ({ onClick, title, children, active }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent textarea from losing focus/selection
        onClick();
      }}
      title={title}
      className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-gray-200 ${
        active ? "bg-purple-100 text-purple-700 ring-1 ring-purple-300" : "text-gray-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">Contenido</Label>
        
        {/* Mode Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setEditorMode("text")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              editorMode === "text"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Texto
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("html")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              editorMode === "html"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            HTML
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("preview")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              editorMode === "preview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="w-3 h-3 inline mr-1" />
            Vista Previa
          </button>
        </div>
      </div>

      {/* Text Editor Mode */}
      {editorMode === "text" && (
        <div>
          {/* Formatting Toolbar */}
          <div className="flex items-center gap-0.5 p-1.5 bg-gray-50 border border-b-0 border-gray-200 rounded-t-lg">
            <ToolbarBtn onClick={() => insertFormatting("**", "**")} title="Negrita (Ctrl+B)">
              <Bold className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => insertFormatting("*", "*")} title="Cursiva (Ctrl+I)">
              <Italic className="w-4 h-4" />
            </ToolbarBtn>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <ToolbarBtn onClick={openLinkDialog} title="Insertar enlace">
              <Link2 className="w-4 h-4" />
            </ToolbarBtn>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <ToolbarBtn onClick={() => insertFormatting("# ", "")} title="Título">
              <Heading1 className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => insertFormatting("## ", "")} title="Subtítulo">
              <Heading2 className="w-4 h-4" />
            </ToolbarBtn>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <ToolbarBtn onClick={() => insertAtCursor("\n- ")} title="Lista">
              <List className="w-4 h-4" />
            </ToolbarBtn>
          </div>

          <textarea
            ref={textareaRef}
            value={module.content}
            onChange={(e) => onChange({ content: e.target.value })}
            onSelect={saveSelection}
            onKeyUp={saveSelection}
            onClick={saveSelection}
            onKeyDown={(e) => {
              // Keyboard shortcuts
              if (e.ctrlKey || e.metaKey) {
                if (e.key === "b") {
                  e.preventDefault();
                  saveSelection();
                  insertFormatting("**", "**");
                } else if (e.key === "i") {
                  e.preventDefault();
                  saveSelection();
                  insertFormatting("*", "*");
                } else if (e.key === "k") {
                  e.preventDefault();
                  saveSelection();
                  openLinkDialog();
                }
              }
            }}
            placeholder="Escribe el contenido de la lección aquí..."
            className="w-full min-h-[250px] p-3 border border-gray-200 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y font-mono text-sm leading-relaxed"
          />

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              <strong>Atajos:</strong> Ctrl+B negrita • Ctrl+I cursiva • Ctrl+K enlace
            </p>
            <p className="text-xs text-gray-400">
              Markdown: **negrita** • *cursiva* • [texto](url) • # Título
            </p>
          </div>
        </div>
      )}

      {/* HTML Editor Mode */}
      {editorMode === "html" && (
        <div>
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-b-0 border-amber-200 rounded-t-lg">
            <Code className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-800 font-medium">Modo HTML — Escribe o pega código HTML directamente</span>
          </div>
          <textarea
            value={module.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder='<h2>Mi título</h2>\n<p>Contenido con <strong>negrita</strong> y <em>cursiva</em></p>\n<a href="https://ejemplo.com">Enlace</a>'
            className="w-full min-h-[250px] p-3 border border-amber-200 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y font-mono text-sm leading-relaxed bg-gray-900 text-green-400"
          />
          <p className="text-xs text-amber-700 mt-2">
            Puedes usar etiquetas HTML como &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;iframe&gt;, etc.
          </p>
        </div>
      )}

      {/* Preview Mode */}
      {editorMode === "preview" && (
        <div className="border border-gray-200 rounded-lg p-6 min-h-[250px] bg-white">
          {module.content ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml(module.content) }}
            />
          ) : (
            <p className="text-gray-400 text-center py-8">No hay contenido para previsualizar</p>
          )}
        </div>
      )}

      {/* Link Dialog */}
      <AlertDialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Insertar Enlace</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="link-text">Texto del enlace</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Haz clic aquí"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://ejemplo.com"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInsertLink();
                  }
                }}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleInsertLink} disabled={!linkUrl}>
              Insertar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function QuizModuleEditor({
  module,
  onChange,
}: {
  module: QuizModule;
  onChange: (updates: Partial<QuizModule>) => void;
}) {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: "",
      question_type: "single_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
    };

    onChange({
      questions: [...module.questions, newQuestion],
    });
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...module.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onChange({ questions: newQuestions });
  };

  const deleteQuestion = (index: number) => {
    onChange({
      questions: module.questions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Título del Quiz</Label>
          <Input
            value={module.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="ej. Examen Lección 1"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Puntaje Mínimo (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={module.passing_score}
            onChange={(e) =>
              onChange({ passing_score: parseInt(e.target.value) })
            }
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Preguntas</Label>
          <span className="text-sm text-gray-500">
            {module.questions.length} pregunta(s)
          </span>
        </div>
        
        {module.questions.map((question, index) => (
          <QuizQuestionEditor
            key={question.id}
            question={question}
            index={index}
            onUpdate={(updates) => updateQuestion(index, updates)}
            onDelete={() => deleteQuestion(index)}
          />
        ))}

        <Button
          onClick={addQuestion}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Pregunta
        </Button>
      </div>
    </div>
  );
}

function QuizQuestionEditor({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: QuizQuestion;
  index: number;
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  onDelete: () => void;
}) {
  const toggleMultipleChoice = (option: string) => {
    const currentAnswers = Array.isArray(question.correct_answer) 
      ? question.correct_answer 
      : [];
    
    const newAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter(a => a !== option)
      : [...currentAnswers, option];
    
    onUpdate({ correct_answer: newAnswers });
  };

  return (
    <Card className="p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-medium text-gray-700">
          Pregunta {index + 1}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-red-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          value={question.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          placeholder="Escribe la pregunta..."
        />

        <Select
          value={question.question_type}
          onValueChange={(value: any) => {
            const updates: Partial<QuizQuestion> = { question_type: value };
            
            // Reset correct_answer based on type
            if (value === "multiple_choice") {
              updates.correct_answer = [];
            } else if (value === "true_false") {
              updates.correct_answer = "";
              updates.options = ["Verdadero", "Falso"];
            } else {
              updates.correct_answer = "";
              if (value === "single_choice" && question.options.length === 2) {
                updates.options = ["", "", "", ""];
              }
            }
            
            onUpdate(updates);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single_choice">Opción Única</SelectItem>
            <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
            <SelectItem value="true_false">Verdadero/Falso</SelectItem>
          </SelectContent>
        </Select>

        {(question.question_type === "single_choice" || question.question_type === "multiple_choice") && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">
              {question.question_type === "multiple_choice" 
                ? "Opciones (selecciona todas las correctas)"
                : "Opciones (selecciona la correcta)"}
            </Label>
            {question.options?.map((option, optIndex) => (
              <div key={optIndex} className="flex gap-2 items-center">
                {question.question_type === "single_choice" ? (
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={question.correct_answer === option && option !== ""}
                    onChange={() => {
                      if (option !== "") {
                        onUpdate({ correct_answer: option });
                      }
                    }}
                    className="flex-shrink-0 w-4 h-4 mt-0"
                    disabled={option === ""}
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={Array.isArray(question.correct_answer) && question.correct_answer.includes(option) && option !== ""}
                    onChange={() => {
                      if (option !== "") {
                        toggleMultipleChoice(option);
                      }
                    }}
                    className="flex-shrink-0 w-4 h-4 mt-0"
                    disabled={option === ""}
                  />
                )}
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(question.options || [])];
                    const oldValue = newOptions[optIndex];
                    const newValue = e.target.value;
                    newOptions[optIndex] = newValue;
                    
                    // Update correct_answer if this option was selected
                    if (question.question_type === "single_choice") {
                      if (question.correct_answer === oldValue) {
                        onUpdate({ options: newOptions, correct_answer: newValue });
                        return;
                      }
                    } else if (question.question_type === "multiple_choice") {
                      if (Array.isArray(question.correct_answer) && question.correct_answer.includes(oldValue)) {
                        const updatedAnswers = question.correct_answer.map(ans => 
                          ans === oldValue ? newValue : ans
                        );
                        onUpdate({ options: newOptions, correct_answer: updatedAnswers });
                        return;
                      }
                    }
                    
                    onUpdate({ options: newOptions });
                  }}
                  placeholder={`Opción ${optIndex + 1}`}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        )}

        {question.question_type === "true_false" && (
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`question-${question.id}-tf`}
                checked={question.correct_answer === "Verdadero"}
                onChange={() => onUpdate({ correct_answer: "Verdadero" })}
              />
              Verdadero
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`question-${question.id}-tf`}
                checked={question.correct_answer === "Falso"}
                onChange={() => onUpdate({ correct_answer: "Falso" })}
              />
              Falso
            </label>
          </div>
        )}

        <div>
          <Label className="text-sm text-gray-600">
            Explicación (opcional - se mostrará si la respuesta es incorrecta)
          </Label>
          <Textarea
            value={question.explanation}
            onChange={(e) => onUpdate({ explanation: e.target.value })}
            placeholder="Explica por qué esta es la respuesta correcta..."
            className="mt-1"
            rows={2}
          />
        </div>
      </div>
    </Card>
  );
}

function LinkModuleEditor({
  module,
  onChange,
}: {
  module: LinkModule;
  onChange: (updates: Partial<LinkModule>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Título del Enlace</Label>
        <Input
          value={module.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="ej. Documentación Adicional"
          className="mt-1"
        />
      </div>
      <div>
        <Label>URL</Label>
        <Input
          value={module.url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://ejemplo.com"
          className="mt-1"
        />
      </div>
      <div>
        <Label>Descripción (opcional)</Label>
        <Textarea
          value={module.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Breve descripción del enlace..."
          className="mt-1"
          rows={2}
        />
      </div>
    </div>
  );
}