"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { transformImageUrl } from "@/lib/image-url";
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
  Eye,
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
  thumbnail_url: string | null;
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
  const [logoInputMode, setLogoInputMode] = useState<"file" | "url">("file");
  const [logoInputUrl, setLogoInputUrl] = useState<string>(logoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteLogoConfirm, setDeleteLogoConfirm] = useState(false);

  const handleDeleteLogo = () => {
    setLogo(null);
    if (logoInputMode === "url") {
      setLogoInputUrl("");
    }
    setDeleteLogoConfirm(false);
    toast.success("Logo eliminado");
  };

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
      toast.error("Por favor selecciona un tipo de documento");
      return;
    }

    if (!logo) {
      toast.error("Por favor sube el logo de tu organización");
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

      toast.success("Configuración guardada exitosamente");
      onUpdate();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <DeleteConfirmDialog
        isOpen={deleteLogoConfirm}
        onClose={() => setDeleteLogoConfirm(false)}
        onConfirm={handleDeleteLogo}
        title="¿Eliminar logo?"
        itemName="Logo de la organización"
      />
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
              className={`p-4 border-2 rounded-lg transition-all ${type === "constancia"
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
              className={`p-4 border-2 rounded-lg transition-all ${type === "certificate"
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
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              Logo de la organización *
            </label>
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setLogoInputMode("file")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  logoInputMode === "file"
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="w-3 h-3 inline mr-1" />
                Archivo
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoInputMode("url");
                  setLogoInputUrl(logo || "");
                }}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  logoInputMode === "url"
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🔗 URL
              </button>
            </div>
          </div>

          {logoInputMode === "file" ? (
            <div className="space-y-3">
              {logo ? (
                <div className="space-y-3">
                  <div className="relative w-full max-w-xs aspect-video border-2 border-border rounded-lg overflow-hidden bg-muted group">
                    <img
                      src={logo}
                      alt="Logo"
                      className="w-full h-full object-contain bg-white transition-opacity group-hover:opacity-60 p-2"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? "Subiendo..." : "Cambiar Logo"}
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
                              toast.error("Error al subir el logo");
                            } finally {
                              setUploading(false);
                            }
                          }}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteLogoConfirm(true)}
                      disabled={uploading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar logo
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-lg hover:border-sky-500 hover:bg-sky-50/50 transition-colors">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/60" />
                    <span className="text-sm font-medium text-foreground">
                      Haz clic para subir logo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG (Recomendado: 500x500px)
                    </span>
                    {uploading && (
                      <div className="flex items-center gap-2 text-sky-600 mt-2 text-sm font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subiendo...
                      </div>
                    )}
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
                          toast.error("Error al subir el logo");
                        } finally {
                          setUploading(false);
                        }
                      }}
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={logoInputUrl}
                  onChange={(e) => setLogoInputUrl(e.target.value)}
                  placeholder="https://ejemplo.com/logo.png"
                  disabled={uploading}
                  type="url"
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (logoInputUrl.trim()) {
                      const result = transformImageUrl(logoInputUrl);
                      setLogo(result.url);
                      if (result.transformed) {
                        setLogoInputUrl(result.url);
                        toast.info("URL convertida automáticamente para visualización directa.");
                      }
                      if (result.warning) {
                        toast.warning(result.warning);
                      }
                      toast.success("URL de logo aplicada. Recuerda hacer clic en 'Guardar Configuración'.");
                    }
                  }}
                  disabled={uploading || !logoInputUrl.trim() || logoInputUrl.trim() === logo}
                  type="button"
                  variant="secondary"
                >
                  Aplicar URL
                </Button>
              </div>
              
              {logo && (
                <div className="space-y-3">
                  <div className="relative w-full max-w-xs aspect-video border-2 border-border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={logo}
                      alt="Logo"
                      className="w-full h-full object-contain p-2 bg-white"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                      }}
                    />
                    {/* Show error if Drive image fails */}
                    {logo.includes('drive.google.com') && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center p-2" style={{ display: 'none' }} ref={(el) => {
                        if (!el) return;
                        const img = el.previousElementSibling as HTMLImageElement;
                        if (img) {
                          img.onerror = () => { img.style.display = 'none'; el.style.display = 'flex'; };
                          img.onload = () => { img.style.display = 'block'; el.style.display = 'none'; };
                        }
                      }}>
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <p className="text-xs text-red-600 font-medium">No se pudo cargar</p>
                        <p className="text-xs text-muted-foreground">El archivo debe ser público en Google Drive</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteLogoConfirm(true)}
                      disabled={uploading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar logo
                    </Button>
                  </div>
                </div>
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
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailInputMode, setThumbnailInputMode] = useState<"file" | "url">("file");
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

  // Thumbnail delete confirmation
  const [deleteThumbnailConfirm, setDeleteThumbnailConfirm] = useState(false);

  // Thumbnail URL warning (for cloud storage links)
  const [thumbnailWarning, setThumbnailWarning] = useState<string | null>(null);
  const [thumbnailLoadError, setThumbnailLoadError] = useState(false);

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
      let finalThumbnailUrl = "";

      if (thumbnailFile) {
        finalThumbnailUrl = await handleThumbnailUpload(thumbnailFile);
      } else if (thumbnailUrl.trim()) {
        // Transform cloud storage URLs before saving
        const result = transformImageUrl(thumbnailUrl);
        finalThumbnailUrl = result.url;
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
        thumbnail_url: finalThumbnailUrl || null,
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

  const calculateSectionProgress = () => {
    if (!course) return {
      basica: { completed: 0, total: 5 },
      media: { completed: 0, total: 3 },
      estructura: { completed: 0, total: 1 },
    };

    // Información Básica (5 fields)
    let basicaCompleted = 0;
    if (course.title) basicaCompleted++;
    if (course.description) basicaCompleted++;
    if (course.organization) basicaCompleted++;
    if (course.instructor_name) basicaCompleted++;
    if (course.learning_outcomes && course.learning_outcomes.length > 0) basicaCompleted++;

    // Media y Detalles (3 fields)
    let mediaCompleted = 0;
    if (course.price !== null && course.price !== undefined) mediaCompleted++;
    if (course.thumbnail_url) mediaCompleted++;
    if (course.certificate_type && course.certificate_logo_url) mediaCompleted++;

    // Estructura del Curso (1 field)
    let estructuraCompleted = 0;
    const hasStructure = sections.some(s => s.lessons && s.lessons.length > 0);
    if (hasStructure) estructuraCompleted++;

    return {
      basica: { completed: basicaCompleted, total: 5 },
      media: { completed: mediaCompleted, total: 3 },
      estructura: { completed: estructuraCompleted, total: 1 },
    };
  };

  const isAllSectionsComplete = () => {
    const p = calculateSectionProgress();
    return (
      p.basica.completed === p.basica.total &&
      p.media.completed === p.media.total &&
      p.estructura.completed === p.estructura.total
    );
  };

  // ===== CREATION MODE (No courseId) =====
  if (!courseId) {
    const isCreationFormValid =
      creationFormData.title &&
      creationFormData.description &&
      creationFormData.instructor_name &&
      creationFormData.category;

    const handleFileSelect = (file: File) => {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    };

    const clearThumbnail = () => {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailUrl("");
    };

    return (
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="border-b border-border bg-background">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <h1 className="text-2xl font-bold text-foreground">
              Crear Nuevo Curso
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin
                ? 'Completa la información para crear el curso. Se aprobará automáticamente.'
                : 'Completa la información para crear el curso. Será enviado para aprobación.'}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <form onSubmit={handleCreateCourse}>
            {creationError && (
              <Alert className="border-red-200 bg-red-50 mb-6">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {creationError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1 - Basic Info */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <LayoutGrid className="w-5 h-5 text-sky-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Información Básica
                  </h2>
                </div>

                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
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
                      className="mt-1.5"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
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
                      rows={4}
                      className="mt-1.5"
                    />
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Organización
                    </label>
                    <Input
                      value={creationFormData.organization}
                      onChange={(e) =>
                        setCreationFormData({
                          ...creationFormData,
                          organization: e.target.value,
                        })
                      }
                      placeholder="Ej: Google"
                      disabled={creating}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Opcional — se mostrará como "Independiente" si está vacío
                    </p>
                  </div>

                  {/* Instructor */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
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
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Column 2 - Details, Price & Thumbnail */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <ListChecks className="w-5 h-5 text-sky-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Detalles del Curso
                  </h2>
                </div>

                {/* Category & Level */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
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
                      className="w-full mt-1.5 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                    <label className="text-sm font-medium text-muted-foreground">
                      Nivel *
                    </label>
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
                      className="w-full mt-1.5 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzado</option>
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-sky-600" />
                    <label className="text-sm font-medium text-muted-foreground">
                      Precio (MXN)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={creationFormData.price}
                      onChange={(e) =>
                        setCreationFormData({
                          ...creationFormData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      min="0"
                      step="0.01"
                      disabled={creating}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">MXN</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Puedes cambiarlo después. Déjalo en 0 para cursos gratuitos.
                  </p>
                </div>

                {/* Thumbnail - Enhanced */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      Imagen de Portada
                    </label>
                    <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailInputMode("file");
                          setThumbnailUrl("");
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                          thumbnailInputMode === "file"
                            ? "bg-background text-foreground shadow-sm font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Upload className="w-3 h-3 inline mr-1" />
                        Archivo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailInputMode("url");
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                          thumbnailInputMode === "url"
                            ? "bg-background text-foreground shadow-sm font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        🔗 URL
                      </button>
                    </div>
                  </div>

                  {thumbnailInputMode === "file" ? (
                    <>
                      {thumbnailPreview ? (
                        <div className="space-y-3">
                          <div className="relative rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                            <img
                              src={thumbnailPreview}
                              alt="Vista previa"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                                Cambiar imagen
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileSelect(file);
                                }}
                                disabled={creating}
                              />
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearThumbnail}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-sky-400 hover:bg-sky-50/50 transition-all">
                            <div className="p-2 bg-sky-100 rounded-full">
                              <ImageIcon className="w-6 h-6 text-sky-600" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Haz clic para subir imagen
                            </span>
                            <span className="text-xs text-muted-foreground/70">
                              PNG, JPG • 1280×720px (16:9)
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(file);
                            }}
                            disabled={creating}
                          />
                        </label>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        value={thumbnailUrl}
                        onChange={(e) => {
                          setThumbnailUrl(e.target.value);
                          setThumbnailWarning(null);
                          setThumbnailLoadError(false);
                        }}
                        placeholder="https://ejemplo.com/imagen.jpg o enlace de Google Drive"
                        disabled={creating}
                        type="url"
                      />
                      {thumbnailUrl.trim() && (() => {
                        const result = transformImageUrl(thumbnailUrl);
                        const previewUrl = result.url;
                        return (
                          <div className="space-y-2">
                            {result.warning && (
                              <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800">{result.warning}</p>
                              </div>
                            )}
                            {result.transformed && (
                              <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-800">URL convertida automáticamente para visualización directa.</p>
                              </div>
                            )}
                            <div className="relative rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                              <img
                                src={previewUrl}
                                alt="Vista previa"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  setThumbnailLoadError(true);
                                }}
                                onLoad={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'block';
                                  setThumbnailLoadError(false);
                                }}
                              />
                              {thumbnailLoadError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center p-3">
                                  <AlertTriangle className="w-6 h-6 text-red-400" />
                                  <p className="text-xs text-red-600 font-medium">No se pudo cargar la imagen</p>
                                  {previewUrl.includes('drive.google.com') ? (
                                    <div className="text-left bg-white/90 rounded-lg p-2.5 border border-red-200 mt-1">
                                      <p className="text-xs text-red-800 font-medium mb-1.5">El archivo debe ser público en Google Drive:</p>
                                      <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                                        <li>Abre el archivo en Google Drive</li>
                                        <li>Clic derecho → <strong>Compartir</strong></li>
                                        <li>En "Acceso general" cambia a <strong>"Cualquier persona con el enlace"</strong></li>
                                        <li>Rol: <strong>Lector</strong></li>
                                        <li>Clic en <strong>Listo</strong></li>
                                      </ol>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">Asegúrate de que el archivo sea público o accesible sin inicio de sesión.</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setThumbnailUrl("");
                                setThumbnailWarning(null);
                                setThumbnailLoadError(false);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Quitar URL
                            </Button>
                          </div>
                        );
                      })()}
                      <p className="text-xs text-muted-foreground">
                        Soporta enlaces directos, Google Drive y OneDrive. Los enlaces se convierten automáticamente.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3 - Summary & Actions */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <Paperclip className="w-5 h-5 text-sky-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Resumen
                  </h2>
                </div>

                {/* Required fields checklist */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Campos requeridos
                  </h3>
                  <ul className="text-sm space-y-2.5">
                    {[
                      { label: "Título del curso", filled: !!creationFormData.title },
                      { label: "Descripción", filled: !!creationFormData.description },
                      { label: "Nombre del instructor", filled: !!creationFormData.instructor_name },
                      { label: "Categoría", filled: !!creationFormData.category },
                    ].map((item) => (
                      <li key={item.label} className="flex items-center gap-2">
                        {item.filled ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        )}
                        <span className={item.filled ? 'text-green-700' : 'text-muted-foreground'}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next steps */}
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                  <h3 className="font-medium text-sky-900 mb-3">
                    Después podrás:
                  </h3>
                  <ul className="text-sm text-sky-800 space-y-2">
                    {[
                      "Agregar capítulos y lecciones",
                      "Subir videos (YouTube, Mux o embed)",
                      "Crear quizzes para cada lección",
                      "Añadir recursos y archivos adjuntos",
                      "Configurar certificados o constancias",
                      isAdmin ? "Publicar cuando esté listo" : "Enviar para aprobación",
                    ].map((text) => (
                      <li key={text} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="space-y-3 sticky top-6">
                  <Button
                    type="submit"
                    disabled={creating || !isCreationFormValid}
                    className="w-full"
                    size="lg"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando curso...
                      </>
                    ) : (
                      'Crear Curso y Continuar'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={creating}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
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

  const sectionProgress = calculateSectionProgress();
  const allComplete = isAllSectionsComplete();
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

      <DeleteConfirmDialog
        isOpen={deleteThumbnailConfirm}
        onClose={() => setDeleteThumbnailConfirm(false)}
        onConfirm={async () => {
          setDeleteThumbnailConfirm(false);
          setSaving(true);
          try {
            await supabase
              .from("courses")
              .update({ thumbnail_url: null })
              .eq("id", courseId);
            setCourse((prev) =>
              prev ? { ...prev, thumbnail_url: null } : null
            );
            toast.success("Imagen eliminada");
            router.refresh();
          } catch (error) {
            console.error("Error deleting thumbnail:", error);
            toast.error("Error al eliminar la imagen");
          } finally {
            setSaving(false);
          }
        }}
        title="¿Eliminar imagen de portada?"
        itemName="Imagen de portada del curso"
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

      {/* Section Progress Bars */}
      <div className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Información Básica", ...sectionProgress.basica },
              { label: "Media y Detalles", ...sectionProgress.media },
              { label: "Estructura del Curso", ...sectionProgress.estructura },
            ].map((section) => {
              const pct = section.total > 0 ? (section.completed / section.total) * 100 : 0;
              const barColor = pct === 0 ? "bg-red-400" : pct === 100 ? "bg-emerald-500" : "bg-amber-400";
              const textColor = pct === 100 ? "text-emerald-600" : pct === 0 ? "text-red-500" : "text-amber-600";
              return (
                <div key={section.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{section.label}</span>
                    <span className={`font-bold tabular-nums ${textColor}`}>
                      {section.completed}/{section.total}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end mt-3">
            <a
              href={isAdmin ? `/admin/courses/${courseId}/preview` : `/teacher/courses/${courseId}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Eye className="w-4 h-4" />
              Vista Previa
            </a>
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
              disabled={saving || (!course.is_published && !allComplete)}
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
                  disabled={saving || !allComplete}
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

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 - Información Básica */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Información Básica
              </h2>
            </div>

            {/* Course Title */}
            <div className="bg-card rounded-xl border border-border p-5">
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
                    <p className="text-base text-foreground font-medium">{course.title}</p>
                  )}
                </div>
                {editingField !== "title" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => startEditing("title", course.title)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </div>

            {/* Course Description */}
            <div className="bg-card rounded-xl border border-border p-5">
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
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>
                {editingField !== "description" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => startEditing("description", course.description)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </div>

            {/* Organization & Instructor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-5">
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
                    <p className="text-sm text-foreground font-medium">
                      {displayOrganization}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground h-7 px-2"
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

              <div className="bg-card rounded-xl border border-border p-5">
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
                    <p className="text-sm text-foreground font-medium">
                      {course.instructor_name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground h-7 px-2"
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

            {/* Learning Outcomes */}
            <LearningOutcomesEditor
              outcomes={course.learning_outcomes || []}
              onUpdate={handleUpdateLearningOutcomes}
              isEditing={editingLearningOutcomes}
              onEditToggle={() =>
                setEditingLearningOutcomes(!editingLearningOutcomes)
              }
            />
          </div>

          {/* Column 2 - Detalles y Media */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <ImageIcon className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Media y Detalles
              </h2>
            </div>
            
            {/* Price Section */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-sky-600" />
                    Precio
                  </h3>
                  {editingField === "price" ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="w-32"
                          step="0.01"
                          min="0"
                          autoFocus
                        />
                        <span className="text-sm text-muted-foreground">MXN</span>
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
                    <p className="text-xl font-semibold text-foreground">
                      {course.price > 0 ? `$${course.price.toFixed(2)} MXN` : "Gratis"}
                    </p>
                  )}
                </div>
                {editingField !== "price" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
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

            {/* Course Image - Enhanced */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Imagen de Portada
                </h3>
                <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailInputMode("file");
                      setThumbnailUrl("");
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      thumbnailInputMode === "file"
                        ? "bg-background text-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Upload className="w-3 h-3 inline mr-1" />
                    Archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailInputMode("url");
                      setThumbnailUrl(course.thumbnail_url || "");
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      thumbnailInputMode === "url"
                        ? "bg-background text-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🔗 URL
                  </button>
                </div>
              </div>

              {thumbnailInputMode === "file" ? (
                <div className="space-y-4">
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted border border-border relative group">
                    {course.thumbnail_url ? (
                      <>
                        <img
                          src={course.thumbnail_url}
                          alt="Course thumbnail"
                          className="w-full h-full object-cover transition-opacity group-hover:opacity-60"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {saving ? "Subiendo..." : "Cambiar Imagen"}
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
                              disabled={saving}
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
                        <span className="text-sm font-medium text-muted-foreground">Subir imagen</span>
                        {saving && <Loader2 className="w-4 h-4 animate-spin text-sky-600 mt-2" />}
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
                          disabled={saving}
                        />
                      </label>
                    )}
                  </div>
                  {course.thumbnail_url && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteThumbnailConfirm(true)}
                        disabled={saving}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={thumbnailUrl}
                      onChange={(e) => {
                        setThumbnailUrl(e.target.value);
                        setThumbnailWarning(null);
                        setThumbnailLoadError(false);
                      }}
                      placeholder="https://ejemplo.com/imagen.jpg o enlace de Google Drive"
                      disabled={saving}
                      type="url"
                      className="flex-1"
                    />
                    <Button
                      onClick={async () => {
                         if (!thumbnailUrl.trim()) return;
                         setSaving(true);
                         setThumbnailWarning(null);
                         setThumbnailLoadError(false);
                         try {
                            // Transform cloud storage URLs before saving
                            const result = transformImageUrl(thumbnailUrl);
                            const finalUrl = result.url;

                            if (result.warning) {
                              setThumbnailWarning(result.warning);
                            }

                            if (result.transformed) {
                              toast.info("URL convertida automáticamente para visualización directa.");
                              // Update the input to show the transformed URL
                              setThumbnailUrl(finalUrl);
                            }

                            await supabase
                                .from("courses")
                                .update({ thumbnail_url: finalUrl })
                                .eq("id", courseId);
                            setCourse((prev) =>
                                prev ? { ...prev, thumbnail_url: finalUrl } : null
                            );
                            toast.success("Imagen de portada guardada exitosamente");
                            router.refresh();
                         } catch (error) {
                            console.error("Error setting thumbnail URL:", error);
                            toast.error("Error al guardar la URL de imagen");
                         } finally {
                            setSaving(false);
                         }
                      }}
                      disabled={saving || !thumbnailUrl.trim() || thumbnailUrl.trim() === course.thumbnail_url}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Guardar URL
                    </Button>
                  </div>

                  {/* URL transformation warning */}
                  {thumbnailWarning && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{thumbnailWarning}</p>
                    </div>
                  )}

                  {/* Image preview */}
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted border border-border relative">
                    {course.thumbnail_url ? (
                      <>
                        <img
                          src={course.thumbnail_url}
                          alt="Course thumbnail"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            setThumbnailLoadError(true);
                          }}
                          onLoad={(e) => {
                            (e.target as HTMLImageElement).style.display = 'block';
                            setThumbnailLoadError(false);
                          }}
                        />
                        {thumbnailLoadError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center p-3">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            <p className="text-sm text-red-600 font-medium">No se pudo cargar la imagen</p>
                            {course.thumbnail_url?.includes('drive.google.com') ? (
                              <div className="text-left bg-white/90 rounded-lg p-2.5 border border-red-200 mt-1">
                                <p className="text-xs text-red-800 font-medium mb-1.5">El archivo debe ser público en Google Drive:</p>
                                <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                                  <li>Abre el archivo en Google Drive</li>
                                  <li>Clic derecho → <strong>Compartir</strong></li>
                                  <li>En "Acceso general" cambia a <strong>"Cualquier persona con el enlace"</strong></li>
                                  <li>Rol: <strong>Lector</strong></li>
                                  <li>Clic en <strong>Listo</strong>, luego vuelve a guardar la URL aquí</li>
                                </ol>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Asegúrate de que el archivo sea público o accesible sin inicio de sesión.</p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Soporta enlaces directos, Google Drive y OneDrive/SharePoint. Los enlaces se convierten automáticamente.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Tamaño recomendado: 1280 × 720 px (16:9) · Máximo 5MB · Formatos: JPG, PNG, WEBP
              </p>
            </div>

            {/* Certificate Section */}
            <CertificateSettings
              courseId={courseId!}
              certificateType={course.certificate_type}
              logoUrl={course.certificate_logo_url}
              onUpdate={fetchCourseData}
            />
          </div>

          {/* Column 3 - Estructura */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <ListChecks className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Estructura del Curso
              </h2>
            </div>

            {/* Course Chapters */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Capítulos y Lecciones
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 hover:text-sky-800"
                  onClick={() => setAddingChapter(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar capítulo
                </Button>
              </div>

              {addingChapter && (
                <div className="mb-4 p-4 bg-sky-50/50 rounded-lg border border-sky-100">
                  <Input
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="Nombre del capítulo"
                    className="mb-3 bg-white"
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
                      className="bg-white"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {sections.length > 0 ? (
                <div className="space-y-2.5">
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, section.id)}
                      className={`transition-all ${dragOverChapter === section.id
                          ? "border-t-2 border-sky-500 pt-2"
                          : ""
                        }`}
                    >
                      <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-lg border border-transparent hover:border-border cursor-move group">
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity" />

                          {editingChapterId === section.id ? (
                            <Input
                              value={editChapterTitle}
                              onChange={(e) =>
                                setEditChapterTitle(e.target.value)
                              }
                              className="flex-1 h-8 text-sm bg-background"
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
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium">
                                {index + 1}. {section.title}
                              </span>
                              <Badge variant="secondary" className="text-[10px] ml-auto font-normal bg-background/80">
                                {section.lessons?.length || 0} lecciones
                              </Badge>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center ml-2 border-l border-border pl-2 border-opacity-0 group-hover:border-opacity-100 transition-all opacity-0 group-hover:opacity-100">
                          {editingChapterId === section.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleUpdateChapter(section.id)}
                                disabled={saving}
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
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
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingChapterId(section.id);
                                  setEditChapterTitle(section.title);
                                }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(section.id, section.title);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {expandedChapters.has(section.id) && (
                        <div className="ml-9 mr-1 mt-2 mb-4 space-y-2 border-l-2 border-muted pl-4 py-1">
                          {section.lessons && section.lessons.length > 0 ? (
                            section.lessons.map(
                              (lesson: any, lessonIndex: number) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between p-2.5 bg-background rounded-md border border-border hover:border-sky-300 hover:shadow-sm cursor-pointer transition-all group/lesson"
                                  onClick={() =>
                                    handleEditLesson(section.id, lesson.id)
                                  }
                                >
                                  <div className="flex items-center gap-2.5 flex-1">
                                    <span className="text-xs font-mono text-muted-foreground w-4 text-right">
                                      {lessonIndex + 1}.
                                    </span>
                                    <span className="text-sm font-medium">
                                      {lesson.title}
                                    </span>
                                    {lesson.is_free_preview && (
                                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 uppercase tracking-wider">
                                        Libre
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="opacity-0 group-hover/lesson:opacity-100 transition-opacity bg-muted p-1.5 rounded-md">
                                    <Pencil className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-md border border-dashed border-border mb-2">
                              No hay lecciones en este capítulo
                            </p>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-solid hover:bg-muted/50 mt-2"
                            onClick={() => handleAddLesson(section.id)}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Agregar Lección
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-border rounded-xl bg-muted/10">
                  <div className="p-3 bg-muted rounded-full mb-3">
                    <ListChecks className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Comienza a estructurar tu curso
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Agrega capítulos para empezar a subir tus lecciones.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingChapter(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Crear primer capítulo
                  </Button>
                </div>
              )}

              {sections.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-border">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">
                    Arrastra los capítulos para reordenarlos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}