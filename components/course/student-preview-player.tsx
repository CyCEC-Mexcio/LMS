// components/course/student-preview-player.tsx
"use client";

import { useState, useMemo } from "react";
import { 
  Lock, 
  Play, 
  Sparkles, 
  Award, 
  BookOpen, 
  Clock, 
  ArrowLeft, 
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CoursePurchaseButton } from "@/components/course/course-purchase-button";
import Link from "next/link";

type Quiz = {
  id: string;
  title: string;
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_provider: string | null;
  mux_playback_id: string | null;
  youtube_url: string | null;
  embed_code: string | null;
  content: string | null;
  duration_minutes: number | null;
  position: number;
  is_free_preview: boolean;
  resources: any;
  has_quiz: boolean;
  quizzes: Quiz[];
};

type Section = {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string | null;
  certificate_type?: string | null;
  sections: Section[];
  price: number;
  currency?: string;
  slug: string;
  is_published: boolean;
  is_approved: boolean;
};

interface StudentPreviewPlayerProps {
  course: Course;
  initialLessonId: string;
  isEnrolled: boolean;
}

export default function StudentPreviewPlayer({
  course,
  initialLessonId,
  isEnrolled,
}: StudentPreviewPlayerProps) {
  // Find initial lesson
  const initialLesson = useMemo(() => {
    for (const section of course.sections) {
      const found = section.lessons.find((l) => l.id === initialLessonId);
      if (found) return found;
    }
    // Fallback to first free preview
    for (const section of course.sections) {
      const found = section.lessons.find((l) => l.is_free_preview);
      if (found) return found;
    }
    return course.sections[0]?.lessons[0] || null;
  }, [course, initialLessonId]);

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(initialLesson);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(course.sections.slice(0, 2).map((s) => s.id))
  );
  
  // Dialog state for locking non-preview lessons
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [selectedLockedLesson, setSelectedLockedLesson] = useState<Lesson | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.is_free_preview) {
      setCurrentLesson(lesson);
    } else {
      setSelectedLockedLesson(lesson);
      setShowLockDialog(true);
    }
  };

  // Helper to extract YouTube video ID
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Render video viewport
  const videoElement = useMemo(() => {
    if (!currentLesson) return null;

    // Embed Code
    if (currentLesson.video_provider === "embed" && currentLesson.embed_code) {
      return (
        <div key={currentLesson.id} className="w-full aspect-video bg-black flex items-center justify-center">
          <div dangerouslySetInnerHTML={{ __html: currentLesson.embed_code }} className="w-full h-full" />
        </div>
      );
    }

    // YouTube
    if (currentLesson.video_provider === "youtube" && currentLesson.youtube_url) {
      const videoId = extractYouTubeId(currentLesson.youtube_url);
      if (videoId) {
        return (
          <div key={currentLesson.id} className="w-full aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
    }

    // Google Drive
    if (currentLesson.video_provider === "google_drive" && currentLesson.video_url) {
      const driveMatch = currentLesson.video_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const driveFileId = driveMatch?.[1];
      if (driveFileId) {
        return (
          <div key={currentLesson.id} className="w-full aspect-video bg-black">
            <iframe
              src={`https://drive.google.com/file/d/${driveFileId}/preview`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        );
      }
    }

    // OneDrive
    if (currentLesson.video_provider === "onedrive" && currentLesson.video_url) {
      let embedSrc = currentLesson.video_url.trim();
      if (!embedSrc.includes("/embed")) {
        embedSrc = embedSrc.replace("redir?", "embed?").replace("/view.aspx?", "/embed?");
      }
      return (
        <div key={currentLesson.id} className="w-full aspect-video bg-black">
          <iframe
            src={embedSrc}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>
      );
    }

    // Mux
    if (currentLesson.video_provider === "mux" && currentLesson.mux_playback_id) {
      return (
        <div key={currentLesson.id} className="w-full aspect-video bg-black">
          <iframe
            src={`https://stream.mux.com/${currentLesson.mux_playback_id}.m3u8`}
            className="w-full h-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Direct Video Link
    if (currentLesson.video_url) {
      return (
        <video key={currentLesson.id} src={currentLesson.video_url} controls className="w-full aspect-video bg-black">
          Tu navegador no soporta reproducción de video.
        </video>
      );
    }

    // Default: No Video / Text Lesson Content preview
    return (
      <div className="bg-slate-50 border border-gray-200 rounded-xl p-12 text-center aspect-video flex flex-col items-center justify-center">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-bold mb-2 text-gray-900">Clase Teórica: {currentLesson.title}</h3>
        <p className="text-gray-500 text-sm max-w-md">
          Esta lección contiene material de estudio completo. Lee la guía de contenido y descarga los recursos a continuación.
        </p>
      </div>
    );
  }, [currentLesson]);

  // Convert basic Markdown/Text to HTML (same utility as standard)
  const formatContent = (text: string): string => {
    if (text.trim().startsWith("<")) return text;
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html = html.replace(/^## (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gray-900 hover:underline font-medium">$1</a>');
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');
    html = html.replace(/\n/g, "<br />");
    return html;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* ── IMMERSIVE TOP BAR ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link 
            href={`/browse/${course.slug}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-lg text-sm font-medium border border-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al curso
          </Link>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <div>
            <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase block">
              Vista Previa Gratuita
            </span>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <span className="text-xs text-gray-500 block">¿Te gusta lo que ves?</span>
            <span className="text-xs text-emerald-600 font-semibold">Inscríbete para desbloquear el contenido</span>
          </div>
          <div className="scale-90 origin-right">
            <CoursePurchaseButton
              courseId={course.id}
              price={course.price}
              currency={course.currency}
              title={course.title}
              isEnrolled={isEnrolled}
              isPublished={course.is_published}
              isApproved={course.is_approved}
            />
          </div>
        </div>
      </header>

      {/* ── DOUBLE COLUMN MAIN LAYOUT ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Theatre Mode viewport & metadata */}
        <section className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Main Video/Viewport Frame */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {videoElement}
            
            {/* Simple Clean Preview Banner below video */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Estás viendo una clase de prueba gratuita</p>
                  <p className="text-xs text-gray-500">Inscríbete para acceder a tareas, exámenes, comunidad y el certificado oficial</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setSelectedLockedLesson(null);
                  setShowLockDialog(true);
                }}
                className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-4 py-2 font-semibold transition-all rounded-lg shrink-0"
              >
                Inscribirse al curso completo
              </Button>
            </div>
          </div>

          {/* Lesson Metadata details */}
          {currentLesson && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <span className="text-xs font-semibold bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full inline-block mb-3">
                  Clase {currentLesson.position}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{currentLesson.title}</h2>
                {currentLesson.duration_minutes && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(currentLesson.duration_minutes)} de duración</span>
                  </div>
                )}
              </div>

              {/* Description & Written Content Card */}
              {(currentLesson.description || currentLesson.content) && (
                <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    {currentLesson.description && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Sinopsis de la Clase</h4>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{currentLesson.description}</p>
                      </div>
                    )}
                    {currentLesson.description && currentLesson.content && <div className="h-px bg-gray-200 my-4" />}
                    {currentLesson.content && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Guía de Estudio</h4>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatContent(currentLesson.content) }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Resources / Attachments */}
              {currentLesson.resources && (Array.isArray(currentLesson.resources) ? currentLesson.resources.length > 0 : Object.keys(currentLesson.resources).length > 0) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-450">Material de Apoyo para esta clase</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Array.isArray(currentLesson.resources) ? currentLesson.resources : Object.values(currentLesson.resources)).map((resource: any, idx: number) => (
                      <a
                        key={resource.id || idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl">📎</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate group-hover:text-gray-900 group-hover:underline">
                              {resource.title || resource.name || "Descargar Recurso"}
                            </p>
                            {resource.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{resource.description}</p>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Column: Dynamic Course Index & Lessons */}
        <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-5 border-b border-gray-200 bg-white sticky top-0 z-20">
            <h3 className="font-bold text-base text-gray-900">Programa de Estudios</h3>
            <p className="text-xs text-gray-500 mt-1">Explora las clases del curso</p>
          </div>

          <div className="p-3 space-y-2 bg-white">
            {course.sections.map((section, sIdx) => {
              const isExpanded = expandedSections.has(section.id);
              const totalSecLessons = section.lessons?.length || 0;
              const freeSecLessons = section.lessons?.filter(l => l.is_free_preview).length || 0;

              return (
                <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-800 truncate pr-2">
                          {sIdx + 1}. {section.title}
                        </h4>
                      </div>
                    </div>
                    {freeSecLessons > 0 && (
                      <Badge className="bg-emerald-50 text-emerald-750 hover:bg-emerald-100 border-emerald-200 text-[10px] shrink-0 font-medium py-0.5">
                        {freeSecLessons} {freeSecLessons === 1 ? "gratis" : "gratis"}
                      </Badge>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-150 bg-gray-50/50 p-1.5 space-y-1">
                      {section.lessons?.map((lesson, lIdx) => {
                        const isCurrent = currentLesson?.id === lesson.id;
                        const isFree = lesson.is_free_preview;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonClick(lesson)}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                              isCurrent
                                ? "bg-gray-100 border-l-4 border-gray-850 text-gray-900 font-semibold"
                                : "hover:bg-white text-gray-650 hover:text-gray-900"
                            }`}
                          >
                            {isFree ? (
                              <Play className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isCurrent ? "text-gray-900" : "text-emerald-600"}`} />
                            ) : (
                              <Lock className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs font-semibold ${isCurrent ? "text-gray-900" : "text-gray-800"}`}>
                                  {lIdx + 1}. {lesson.title}
                                </p>
                                {isFree && !isCurrent && (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase shrink-0 tracking-wider">
                                    Gratis
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                                {lesson.duration_minutes && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    {formatDuration(lesson.duration_minutes)}
                                  </span>
                                )}
                                {lesson.has_quiz && (
                                  <span className="text-orange-600 flex items-center gap-1">
                                    • Evaluado
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {(!section.lessons || section.lessons.length === 0) && (
                        <p className="text-xs text-gray-400 text-center py-3">Sin lecciones disponibles</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </main>

      {/* ── CLEAN LOCKED ACTION DIALOG ────────────────────────────────────────── */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent className="bg-white border border-gray-200 text-gray-900 max-w-md p-6 rounded-2xl overflow-hidden shadow-lg">
          <DialogHeader className="text-center space-y-3">
            <div className="w-14 h-14 bg-gray-100 border border-gray-250 rounded-2xl flex items-center justify-center mx-auto text-gray-700 mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
              {selectedLockedLesson ? `Desbloquear "${selectedLockedLesson.title}"` : "Acceso Completo al Curso"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
              Inscríbete hoy mismo y obtén acceso instantáneo a todas las lecciones del curso, incluyendo:
            </DialogDescription>
          </DialogHeader>

          {/* Value Props list */}
          <div className="my-5 space-y-3.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-gray-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">Acceso de por vida ilimitado</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Aprende a tu propio ritmo, desde cualquier dispositivo.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-gray-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">Certificación Oficial</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Recibe tu certificado descargable con validez curricular al completar.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-gray-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">Ejercicios y Evaluaciones</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Pon a prueba tus conocimientos con cuestionarios interactivos.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <CoursePurchaseButton
              courseId={course.id}
              price={course.price}
              currency={course.currency}
              title={course.title}
              isEnrolled={isEnrolled}
              isPublished={course.is_published}
              isApproved={course.is_approved}
            />
            <Button
              variant="ghost"
              onClick={() => setShowLockDialog(false)}
              className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-xs font-medium py-2 rounded-lg"
            >
              Seguir explorando clases gratis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
