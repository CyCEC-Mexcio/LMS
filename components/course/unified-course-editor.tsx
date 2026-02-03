"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LayoutGrid,
  ListChecks,
  DollarSign,
  Paperclip,
  Pencil,
  Plus,
  Upload,
  GripVertical,
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
  Award,
  AlertTriangle,
  Send,
  CheckCircle,
  Clock,
  X,
  Image as ImageIcon,
} from "lucide-react";

type Chapter = {
  id: string;
  title: string;
  position: number;
  lessons: any[];
};

type CourseData = {
  id: string;
  title: string;
  description: string;
  organization: string;
  instructor_name: string;
  thumbnail_url: string;
  price: number;
  category: string;
  level: string;
  is_approved: boolean;
  is_published: boolean;
  pending_approval: boolean;
  learning_outcomes: string[] | null;
  certificate_type: "certificate" | "constancia" | null;
  certificate_logo_url: string | null;
};

type UnifiedCourseEditorProps = {
  courseId?: string;
  isAdmin?: boolean;
};

// Delete Confirmation Dialog Component
function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <p className="text-gray-600 mb-2">
          Estás a punto de eliminar: <strong>{itemName}</strong>
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-red-800 font-medium">
            Esta acción es irreversible
          </p>
          <p className="text-xs text-red-700 mt-1">
            Todos los datos asociados serán eliminados permanentemente.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Sí, eliminar permanentemente
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Learning Outcomes Editor Component
function LearningOutcomesEditor({
  outcomes,
  onUpdate,
  isEditing,
  onEditToggle,
}: {
  outcomes: string[];
  onUpdate: (outcomes: string[]) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}) {
  const [localOutcomes, setLocalOutcomes] = useState<string[]>(outcomes);
  const [newOutcome, setNewOutcome] = useState("");

  useEffect(() => {
    setLocalOutcomes(outcomes);
  }, [outcomes]);

  const handleAdd = () => {
    if (newOutcome.trim()) {
      setLocalOutcomes([...localOutcomes, newOutcome.trim()]);
      setNewOutcome("");
    }
  };

  const handleRemove = (index: number) => {
    setLocalOutcomes(localOutcomes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdate(localOutcomes);
    onEditToggle();
  };

  if (!isEditing) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Lo que aprenderás
          </h3>
          <Button variant="ghost" size="sm" onClick={onEditToggle}>
            <Pencil className="w-4 h-4 mr-1" />
            Editar
          </Button>
        </div>

        {outcomes.length > 0 ? (
          <ul className="space-y-2">
            {outcomes.map((outcome, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{outcome}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No se han agregado objetivos de aprendizaje
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Lo que aprenderás
      </h3>

      <div className="space-y-3 mb-4">
        {localOutcomes.map((outcome, index) => (
          <div key={index} className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-2" />
            <Input
              value={outcome}
              onChange={(e) => {
                const updated = [...localOutcomes];
                updated[index] = e.target.value;
                setLocalOutcomes(updated);
              }}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
              className="text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={newOutcome}
          onChange={(e) => setNewOutcome(e.target.value)}
          placeholder="Agregar nuevo objetivo..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button onClick={handleAdd} variant="outline">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave}>Guardar</Button>
        <Button
          variant="outline"
          onClick={() => {
            setLocalOutcomes(outcomes);
            onEditToggle();
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// Certificate Settings Component
function CertificateSettings({
  courseId,
  certificateType,
  logoUrl,
  onUpdate,
}: {
  courseId: string;
  certificateType: "certificate" | "constancia" | null;
  logoUrl: string | null;
  onUpdate: () => void;
}) {
  const supabase = createClient();
  const [type, setType] = useState<"certificate" | "constancia" | null>(
    certificateType
  );
  const [logo, setLogo] = useState<string | null>(logoUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `certificate-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("course-assets")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("course-assets").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!type) {
      alert("Por favor selecciona un tipo de documento");
      return;
    }

    if (!logo) {
      alert("Por favor sube el logo de tu organización");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("courses")
        .update({
          certificate_type: type,
          certificate_logo_url: logo,
        })
        .eq("id", courseId);

      if (error) throw error;

      alert("Configuración guardada exitosamente");
      onUpdate();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-100 rounded-lg">
          <Award className="w-5 h-5 text-sky-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Documento de Finalización
        </h2>
      </div>

      <div className="bg-card rounded-lg border border-border p-5 space-y-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            📋 Información Importante
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>
              • <strong>Constancia:</strong> Se otorga GRATIS al completar el
              curso
            </li>
            <li>
              • <strong>Certificado:</strong> Requiere aprobar un examen (con
              costo adicional)
            </li>
            <li>• Debes elegir una de las dos opciones</li>
            <li>• Es obligatorio subir el logo de tu organización</li>
          </ul>
        </div>

        {/* Type Selection */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Tipo de documento *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setType("constancia")}
              className={`p-4 border-2 rounded-lg transition-all ${
                type === "constancia"
                  ? "border-sky-600 bg-sky-50"
                  : "border-gray-200 hover:border-sky-300"
              }`}
            >
              <div className="text-left">
                <div className="font-semibold text-sm mb-1">Constancia</div>
                <div className="text-xs text-muted-foreground">
                  Gratis al completar
                </div>
                {type === "constancia" && (
                  <Badge className="mt-2 bg-sky-600">Seleccionado</Badge>
                )}
              </div>
            </button>

            <button
              onClick={() => setType("certificate")}
              className={`p-4 border-2 rounded-lg transition-all ${
                type === "certificate"
                  ? "border-sky-600 bg-sky-50"
                  : "border-gray-200 hover:border-sky-300"
              }`}
            >
              <div className="text-left">
                <div className="font-semibold text-sm mb-1">Certificado</div>
                <div className="text-xs text-muted-foreground">
                  Requiere examen de pago
                </div>
                {type === "certificate" && (
                  <Badge className="mt-2 bg-sky-600">Seleccionado</Badge>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Logo de la organización *
          </label>

          {logo ? (
            <div className="space-y-3">
              <div className="relative w-48 h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-full h-full object-contain p-4"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLogo(null);
                  setUploading(false);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cambiar logo
              </Button>
            </div>
          ) : (
            <div>
              <label className="cursor-pointer">
                <div className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-sky-500 transition-colors flex flex-col items-center gap-2">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Haz clic para subir logo
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG (Recomendado: 500x500px)
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setUploading(true);
                    try {
                      const url = await handleLogoUpload(file);
                      setLogo(url);
                    } catch (error) {
                      console.error("Error uploading logo:", error);
                      alert("Error al subir el logo");
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading}
                />
              </label>
              {uploading && (
                <p className="text-sm text-gray-500 mt-2">Subiendo logo...</p>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving || !type || !logo}
          className="w-full"
        >
          {saving ? "Guardando..." : "Guardar Configuración"}
        </Button>

        {/* Requirements Info */}
        {type && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h5 className="text-xs font-medium text-amber-900 mb-2">
              Requisitos para obtener {type === "certificate" ? "el certificado" : "la constancia"}:
            </h5>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Completar todas las lecciones del curso</li>
              {type === "certificate" && (
                <li>• Aprobar el examen final con puntaje mínimo</li>
              )}
              <li>• Ver al menos el 80% de cada video</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnifiedCourseEditor({
  courseId,
  isAdmin = false,
}: UnifiedCourseEditorProps) {
  const router = useRouter();
  const supabase = createClient();

  // State for creation form
  const [creationFormData, setCreationFormData] = useState({
    title: "",
    description: "",
    organization: "",
    instructor_name: "",
    category: "",
    level: "beginner",
    price: 0,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  // State for editing mode
  const [course, setCourse] = useState<CourseData | null>(null);
  const [sections, setSections] = useState<Chapter[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );

  // Learning outcomes editing
  const [editingLearningOutcomes, setEditingLearningOutcomes] = useState(false);

  // Drag and drop state
  const [draggedChapter, setDraggedChapter] = useState<string | null>(null);
  const [dragOverChapter, setDragOverChapter] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    chapterId: string | null;
    chapterName: string;
  }>({
    isOpen: false,
    chapterId: null,
    chapterName: "",
  });

  // Publish/Submit dialogs
  const [submitForApprovalDialog, setSubmitForApprovalDialog] = useState(false);
  const [publishDialog, setPublishDialog] = useState(false);
  const [unpublishDialog, setUnpublishDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  // Load course data if editing
  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      if (!courseData) throw new Error("Curso no encontrado");

      setCourse(courseData);

      const { data: sectionsData, error: sectionsError } = await supabase
        .from("sections")
        .select(
          `
          id,
          title,
          position,
          lessons (id, title, position, is_free_preview)
        `
        )
        .eq("course_id", courseId)
        .order("position", { ascending: true });

      if (sectionsError) {
        console.error("Error fetching sections:", sectionsError);
      }

      setSections(sectionsData || []);
    } catch (error: any) {
      console.error("Error in fetchCourseData:", error);
      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  // Handle initial course creation
  const handleThumbnailUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
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
    setCreating(true);
    setCreationError(null);

    try {
      let thumbnailUrl = "";

      if (thumbnailFile) {
        thumbnailUrl = await handleThumbnailUpload(thumbnailFile);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No autenticado");

      const slug = creationFormData.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const courseData = {
        title: creationFormData.title,
        description: creationFormData.description,
        organization: creationFormData.organization || null,
        instructor_name: creationFormData.instructor_name,
        category: creationFormData.category,
        level: creationFormData.level,
        thumbnail_url: thumbnailUrl || null,
        price: creationFormData.price,
        currency: "MXN",
        slug: slug,
        teacher_id: user.id,
        is_approved: isAdmin,
        is_published: false,
        pending_approval: false,
        learning_outcomes: [],
        certificate_type: null,
        certificate_logo_url: null,
      };

      const { data: newCourse, error: insertError } = await supabase
        .from("courses")
        .insert([courseData])
        .select()
        .single();

      if (insertError) throw insertError;
      if (!newCourse) throw new Error("No se pudo crear el curso");

      const redirectPath = isAdmin
        ? `/admin/courses/${newCourse.id}`
        : `/teacher/courses/${newCourse.id}`;

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      console.error("Error creating course:", err);
      setCreationError(err.message || "Error al crear el curso");
    } finally {
      setCreating(false);
    }
  };

  // Editing functions
  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const saveField = async (field: string) => {
    if (!courseId) return;

    setSaving(true);
    try {
      let updateValue: any = tempValue;

      if (field === "thumbnail_url" && thumbnailFile) {
        updateValue = await handleThumbnailUpload(thumbnailFile);
        setThumbnailFile(null);
      }

      if (field === "price") {
        updateValue = parseFloat(tempValue);
      }

      const { error } = await supabase
        .from("courses")
        .update({ [field]: updateValue })
        .eq("id", courseId);

      if (error) throw error;

      setCourse((prev) => (prev ? { ...prev, [field]: updateValue } : null));
      setEditingField(null);
      router.refresh();
    } catch (error) {
      console.error("Error saving field:", error);
      setSuccessMessage("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue("");
    setThumbnailFile(null);
  };

  const handleUpdateLearningOutcomes = async (outcomes: string[]) => {
    if (!courseId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("courses")
        .update({ learning_outcomes: outcomes })
        .eq("id", courseId);

      if (error) throw error;

      setCourse((prev) =>
        prev ? { ...prev, learning_outcomes: outcomes } : null
      );
      setSuccessMessage("Objetivos actualizados");
      router.refresh();
    } catch (error) {
      console.error("Error updating learning outcomes:", error);
      setSuccessMessage("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const toggleChapterExpand = (sectionId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim() || !courseId) return;

    setSaving(true);
    try {
      const newPosition = sections.length;

      const { data, error } = await supabase
        .from("sections")
        .insert({
          course_id: courseId,
          title: newChapterTitle,
          position: newPosition,
        })
        .select()
        .single();

      if (error) throw error;

      setSections([...sections, { ...data, lessons: [] }]);
      setNewChapterTitle("");
      setAddingChapter(false);

      const newExpanded = new Set(expandedChapters);
      newExpanded.add(data.id);
      setExpandedChapters(newExpanded);

      router.refresh();
    } catch (error) {
      console.error("Error creating chapter:", error);
      setSuccessMessage("Error al crear capítulo");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateChapter = async (sectionId: string) => {
    if (!editChapterTitle.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("sections")
        .update({ title: editChapterTitle })
        .eq("id", sectionId);

      if (error) throw error;

      setSections(
        sections.map((s) =>
          s.id === sectionId ? { ...s, title: editChapterTitle } : s
        )
      );
      setEditingChapterId(null);
      setEditChapterTitle("");
      router.refresh();
    } catch (error) {
      console.error("Error updating chapter:", error);
      setSuccessMessage("Error al actualizar capítulo");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (sectionId: string, sectionTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      chapterId: sectionId,
      chapterName: sectionTitle,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      chapterId: null,
      chapterName: "",
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.chapterId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("sections")
        .delete()
        .eq("id", deleteDialog.chapterId);

      if (error) throw error;

      setSections(sections.filter((s) => s.id !== deleteDialog.chapterId));
      closeDeleteDialog();
      router.refresh();
    } catch (error) {
      console.error("Error deleting chapter:", error);
      setSuccessMessage("Error al eliminar capítulo");
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedChapter(sectionId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverChapter(sectionId);
  };

  const handleDragLeave = () => {
    setDragOverChapter(null);
  };

  const handleDrop = async (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();

    if (!draggedChapter || draggedChapter === targetSectionId) {
      setDraggedChapter(null);
      setDragOverChapter(null);
      return;
    }

    const draggedIndex = sections.findIndex((s) => s.id === draggedChapter);
    const targetIndex = sections.findIndex((s) => s.id === targetSectionId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSections = [...sections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    const updatedSections = newSections.map((section, index) => ({
      ...section,
      position: index,
    }));

    setSections(updatedSections);

    try {
      const updates = updatedSections.map((section) =>
        supabase
          .from("sections")
          .update({ position: section.position })
          .eq("id", section.id)
      );

      await Promise.all(updates);
      router.refresh();
    } catch (error) {
      console.error("Error updating chapter positions:", error);
      setSuccessMessage("Error al reordenar capítulos");
      fetchCourseData();
    }

    setDraggedChapter(null);
    setDragOverChapter(null);
  };

  const handleAddLesson = (sectionId: string) => {
    const basePath = isAdmin ? "/admin" : "/teacher";
    router.push(
      `${basePath}/courses/${courseId}/chapters/${sectionId}/lessons/new`
    );
  };

  const handleEditLesson = (sectionId: string, lessonId: string) => {
    const basePath = isAdmin ? "/admin" : "/teacher";
    router.push(
      `${basePath}/courses/${courseId}/chapters/${sectionId}/lessons/${lessonId}`
    );
  };

  // Submit for approval (Teachers only)
  const handleSubmitForApproval = async () => {
    setSaving(true);
    setSuccessMessage("");
    try {
      const { error } = await supabase
        .from("courses")
        .update({
          pending_approval: true,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", courseId);

      if (error) throw error;

      setCourse((prev) => (prev ? { ...prev, pending_approval: true } : null));
      setSubmitForApprovalDialog(false);
      setSuccessMessage("Curso enviado para aprobación");
      router.refresh();
    } catch (error) {
      console.error("Error submitting for approval:", error);
      setSuccessMessage("Error al enviar para aprobación");
    } finally {
      setSaving(false);
    }
  };

  // Admin publish
  const handlePublish = async () => {
    setSaving(true);
    setSuccessMessage("");
    try {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: true })
        .eq("id", courseId);

      if (error) throw error;

      setCourse((prev) => (prev ? { ...prev, is_published: true } : null));
      setPublishDialog(false);
      setSuccessMessage("Curso publicado exitosamente");
      router.refresh();
    } catch (error) {
      console.error("Error publishing:", error);
      setSuccessMessage("Error al publicar el curso");
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    setSaving(true);
    setSuccessMessage("");
    try {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: false })
        .eq("id", courseId);

      if (error) throw error;

      setCourse((prev) => (prev ? { ...prev, is_published: false } : null));
      setUnpublishDialog(false);
      setSuccessMessage("Curso despublicado exitosamente");
      router.refresh();
    } catch (error) {
      console.error("Error unpublishing:", error);
      setSuccessMessage("Error al despublicar el curso");
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = () => {
    if (!course) return { completed: 0, total: 7 };

    let completed = 0;
    const total = 7;

    if (course.title) completed++;
    if (course.description) completed++;
    if (course.instructor_name) completed++;
    if (sections.length > 0) completed++;
    if (course.learning_outcomes && course.learning_outcomes.length > 0)
      completed++;
    if (course.certificate_type && course.certificate_logo_url) completed++;
    if (course.thumbnail_url) completed++;

    return { completed, total };
  };

  // ===== CREATION MODE (No courseId) =====
  if (!courseId) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crear Nuevo Curso
          </h1>
          <p className="text-gray-600">
            Completa la información básica para comenzar. Podrás agregar
            capítulos y lecciones después.
          </p>
        </div>

        <form onSubmit={handleCreateCourse} className="space-y-6">
          {creationError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {creationError}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Título del Curso *
            </label>
            <Input
              value={creationFormData.title}
              onChange={(e) =>
                setCreationFormData({ ...creationFormData, title: e.target.value })
              }
              placeholder="Ej: Introducción a Python"
              required
              disabled={creating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Descripción *
            </label>
            <Textarea
              value={creationFormData.description}
              onChange={(e) =>
                setCreationFormData({
                  ...creationFormData,
                  description: e.target.value,
                })
              }
              placeholder="Describe de qué trata el curso..."
              required
              disabled={creating}
              rows={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organización</label>
            <Input
              value={creationFormData.organization}
              onChange={(e) =>
                setCreationFormData({
                  ...creationFormData,
                  organization: e.target.value,
                })
              }
              placeholder="Ej: Google, Microsoft, o deja vacío para 'Independiente'"
              disabled={creating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Opcional - Si lo dejas vacío se mostrará como "Independiente"
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre del Instructor *
            </label>
            <Input
              value={creationFormData.instructor_name}
              onChange={(e) =>
                setCreationFormData({
                  ...creationFormData,
                  instructor_name: e.target.value,
                })
              }
              placeholder="Tu nombre completo"
              required
              disabled={creating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Categoría *
              </label>
              <select
                value={creationFormData.category}
                onChange={(e) =>
                  setCreationFormData({
                    ...creationFormData,
                    category: e.target.value,
                  })
                }
                required
                disabled={creating}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium mb-1">Nivel *</label>
              <select
                value={creationFormData.level}
                onChange={(e) =>
                  setCreationFormData({
                    ...creationFormData,
                    level: e.target.value,
                  })
                }
                required
                disabled={creating}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Imagen de Portada
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setThumbnailFile(file);
              }}
              disabled={creating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Recomendado: 1280x720px (16:9)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creando..." : "Crear Curso y Continuar"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ===== EDIT MODE (Has courseId) =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return <div>Curso no encontrado</div>;
  }

  const progress = calculateProgress();
  const displayOrganization = course.organization || "Independiente";

  return (
    <div className="min-h-screen bg-muted/30">
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title="¿Eliminar capítulo?"
        itemName={deleteDialog.chapterName}
      />

      {/* Submit for Approval Dialog */}
      <Dialog
        open={submitForApprovalDialog}
        onOpenChange={setSubmitForApprovalDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Enviar para Aprobación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas enviar este curso para aprobación? Un
              administrador lo revisará antes de que puedas publicarlo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmitForApprovalDialog(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitForApproval}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "Enviando..." : "Enviar para Aprobación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog open={publishDialog} onOpenChange={setPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Publicar Curso
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas publicar este curso? Será visible para
              todos los estudiantes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishDialog(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePublish}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? "Publicando..." : "Publicar Curso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish Dialog */}
      <Dialog open={unpublishDialog} onOpenChange={setUnpublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Despublicar Curso</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas despublicar este curso? Ya no será
              visible para estudiantes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnpublishDialog(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUnpublish}
              disabled={saving}
              variant="destructive"
            >
              {saving ? "Despublicando..." : "Despublicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Bar */}
      <div className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Completa todos los campos ({progress.completed}/{progress.total})
          </span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all"
              style={{
                width: `${(progress.completed / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="max-w-6xl mx-auto mt-4 mx-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Status Banners */}
      {isAdmin ? (
        <div className="border-b border-border bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {course.is_published ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Curso publicado
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  Curso no publicado
                </span>
              )}
            </p>
            <Button
              size="sm"
              onClick={() =>
                course.is_published
                  ? setUnpublishDialog(true)
                  : setPublishDialog(true)
              }
              disabled={saving}
              variant={course.is_published ? "outline" : "default"}
            >
              {course.is_published ? "Despublicar" : "Publicar"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {course.pending_approval && !course.is_approved && (
            <div className="border-b border-border bg-amber-50">
              <div className="max-w-6xl mx-auto px-6 py-3">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Este curso está pendiente de aprobación. Te notificaremos cuando
                  sea aprobado.
                </p>
              </div>
            </div>
          )}

          {!course.pending_approval && !course.is_approved && (
            <div className="border-b border-border bg-blue-50">
              <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  Completa tu curso y envíalo para aprobación cuando esté listo.
                </p>
                <Button
                  size="sm"
                  onClick={() => setSubmitForApprovalDialog(true)}
                  disabled={saving || progress.completed < progress.total}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para Aprobación
                </Button>
              </div>
            </div>
          )}

          {course.is_approved && !course.is_published && (
            <div className="border-b border-border bg-green-50">
              <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Tu curso ha sido aprobado. Puedes publicarlo cuando quieras.
                </p>
                <Button
                  size="sm"
                  onClick={() => setPublishDialog(true)}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Publicar Curso
                </Button>
              </div>
            </div>
          )}

          {course.is_published && (
            <div className="border-b border-border bg-green-50">
              <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Este curso está publicado y visible para estudiantes
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUnpublishDialog(true)}
                  disabled={saving}
                >
                  Despublicar
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Personaliza tu curso
              </h2>
            </div>

            {/* Course Title */}
            <div className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Título del curso
                  </h3>
                  {editingField === "title" ? (
                    <div className="space-y-3">
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-base"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveField("title")}
                          disabled={saving}
                        >
                          {saving ? "Guardando..." : "Guardar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-base text-foreground">{course.title}</p>
                  )}
                </div>
                {editingField !== "title" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing("title", course.title)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </div>

            {/* Course Description */}
            <div className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Descripción del curso
                  </h3>
                  {editingField === "description" ? (
                    <div className="space-y-3">
                      <Textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveField("description")}
                          disabled={saving}
                        >
                          {saving ? "Guardando..." : "Guardar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-base text-foreground whitespace-pre-wrap">
                      {course.description}
                    </p>
                  )}
                </div>
                {editingField !== "description" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing("description", course.description)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </div>

            {/* Learning Outcomes */}
            <LearningOutcomesEditor
              outcomes={course.learning_outcomes || []}
              onUpdate={handleUpdateLearningOutcomes}
              isEditing={editingLearningOutcomes}
              onEditToggle={() =>
                setEditingLearningOutcomes(!editingLearningOutcomes)
              }
            />

            {/* Organization & Instructor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Organización
                </h3>
                {editingField === "organization" ? (
                  <div className="space-y-2">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="Deja vacío para 'Independiente'"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveField("organization")}
                        disabled={saving}
                      >
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-base text-foreground">
                      {displayOrganization}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() =>
                        startEditing("organization", course.organization || "")
                      }
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  </>
                )}
              </div>

              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Instructor
                </h3>
                {editingField === "instructor_name" ? (
                  <div className="space-y-2">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveField("instructor_name")}
                        disabled={saving}
                      >
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-base text-foreground">
                      {course.instructor_name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() =>
                        startEditing("instructor_name", course.instructor_name)
                      }
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Course Image */}
            <div className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Imagen del curso
                </h3>
                <label>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="cursor-pointer"
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-1" />
                      Cambiar
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setSaving(true);
                      try {
                        const url = await handleThumbnailUpload(file);
                        await supabase
                          .from("courses")
                          .update({ thumbnail_url: url })
                          .eq("id", courseId);
                        setCourse((prev) =>
                          prev ? { ...prev, thumbnail_url: url } : null
                        );
                        router.refresh();
                      } catch (error) {
                        console.error("Error uploading thumbnail:", error);
                        setSuccessMessage("Error al subir imagen");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden bg-muted">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt="Course thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sin imagen
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Course Chapters */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <ListChecks className="w-5 h-5 text-sky-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Capítulos del curso
                </h2>
              </div>

              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Capítulos
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddingChapter(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar capítulo
                  </Button>
                </div>

                {addingChapter && (
                  <div className="mb-4 p-3 bg-sky-50 rounded-lg border border-sky-200">
                    <Input
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder="Nombre del capítulo"
                      className="mb-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateChapter();
                        if (e.key === "Escape") {
                          setAddingChapter(false);
                          setNewChapterTitle("");
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreateChapter}
                        disabled={saving}
                      >
                        {saving ? "Creando..." : "Crear"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddingChapter(false);
                          setNewChapterTitle("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {sections.length > 0 ? (
                  <div className="space-y-2">
                    {sections.map((section, index) => (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                        className={`transition-all ${
                          dragOverChapter === section.id
                            ? "border-t-2 border-sky-500 pt-2"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group hover:bg-muted cursor-move">
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />

                            {editingChapterId === section.id ? (
                              <Input
                                value={editChapterTitle}
                                onChange={(e) =>
                                  setEditChapterTitle(e.target.value)
                                }
                                className="flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleUpdateChapter(section.id);
                                  if (e.key === "Escape") {
                                    setEditingChapterId(null);
                                    setEditChapterTitle("");
                                  }
                                }}
                              />
                            ) : (
                              <button
                                onClick={() => toggleChapterExpand(section.id)}
                                className="flex items-center gap-2 flex-1 text-left"
                              >
                                {expandedChapters.has(section.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <span className="text-sm font-medium">
                                  {index + 1}. {section.title}
                                </span>
                                <Badge variant="outline" className="text-xs ml-2">
                                  {section.lessons?.length || 0} lecciones
                                </Badge>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {editingChapterId === section.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateChapter(section.id)}
                                  disabled={saving}
                                >
                                  Guardar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingChapterId(null);
                                    setEditChapterTitle("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingChapterId(section.id);
                                    setEditChapterTitle(section.title);
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-600 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDialog(section.id, section.title);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {expandedChapters.has(section.id) && (
                          <div className="ml-7 mt-2 space-y-2">
                            {section.lessons && section.lessons.length > 0 ? (
                              section.lessons.map(
                                (lesson: any, lessonIndex: number) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center justify-between p-2 bg-background rounded border hover:border-sky-300 cursor-pointer"
                                    onClick={() =>
                                      handleEditLesson(section.id, lesson.id)
                                    }
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="text-xs text-muted-foreground w-6">
                                        {lessonIndex + 1}.
                                      </span>
                                      <span className="text-sm">
                                        {lesson.title}
                                      </span>
                                      {lesson.is_free_preview && (
                                        <Badge variant="outline" className="text-xs">
                                          Preview
                                        </Badge>
                                      )}
                                    </div>
                                    <Pencil className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                )
                              )
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-3">
                                No hay lecciones aún
                              </p>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleAddLesson(section.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Agregar Lección
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay capítulos aún
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-4">
                  Arrastra los capítulos para reordenarlos
                </p>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-sky-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Precio del curso
                </h2>
              </div>

              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Precio
                    </h3>
                    {editingField === "price" ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span>$</span>
                          <Input
                            type="number"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="w-32"
                            step="0.01"
                            min="0"
                            autoFocus
                          />
                          <span className="text-sm">MXN</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveField("price")}
                            disabled={saving}
                          >
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base">
                        ${course.price.toFixed(2)} MXN
                      </p>
                    )}
                  </div>
                  {editingField !== "price" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        startEditing("price", course.price.toString())
                      }
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Certificate Section */}
            <CertificateSettings
              courseId={courseId}
              certificateType={course.certificate_type}
              logoUrl={course.certificate_logo_url}
              onUpdate={fetchCourseData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}