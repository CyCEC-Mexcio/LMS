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
  CheckCircle, 
  PlayCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center aspect-video flex flex-col items-center justify-center text-white">
        <BookOpen className="w-16 h-16 text-indigo-400 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold mb-2">Clase Teórica: {currentLesson.title}</h3>
        <p className="text-slate-400 text-sm max-w-md">
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
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');
    html = html.replace(/\n/g, "<br />");
    return html;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* ── IMMERSIVE TOP BAR ─────────────────────────────────────────────────── */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link 
            href={`/browse/${course.slug}`}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al curso
          </Link>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase block">
              Clase Abierta · Vista Previa Gratuita
            </span>
            <h1 className="text-sm sm:text-base font-bold truncate max-w-xs sm:max-w-md">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <span className="text-xs text-slate-400 block">¿Te gusta lo que ves?</span>
            <span className="text-xs text-emerald-400 font-medium">Inscríbete para desbloquear el contenido</span>
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
        <section className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Main Video/Viewport Frame */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/20">
            {videoElement}
            
            {/* Immersive Preview Banner below video */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Estás viendo una clase de prueba gratuita</p>
                  <p className="text-xs text-slate-400">Inscríbete para acceder a tareas, exámenes, comunidad y el certificado oficial</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setSelectedLockedLesson(null);
                  setShowLockDialog(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 font-semibold shadow-lg shadow-indigo-500/20 transition-all rounded-lg shrink-0"
              >
                Inscribirse al curso completo
              </Button>
            </div>
          </div>

          {/* Lesson Metadata details */}
          {currentLesson && (
            <div className="space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <span className="text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full inline-block mb-3">
                  Clase {currentLesson.position}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{currentLesson.title}</h2>
                {currentLesson.duration_minutes && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{currentLesson.duration_minutes} minutos de duración</span>
                  </div>
                )}
              </div>

              {/* Description & Written Content Card */}
              {(currentLesson.description || currentLesson.content) && (
                <Card className="bg-slate-900/40 border border-slate-800/60 rounded-xl overflow-hidden backdrop-blur-sm">
                  <CardContent className="p-6 space-y-4">
                    {currentLesson.description && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sinopsis de la Clase</h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{currentLesson.description}</p>
                      </div>
                    )}
                    {currentLesson.description && currentLesson.content && <div className="h-px bg-slate-800/60 my-4" />}
                    {currentLesson.content && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Guía de Estudio</h4>
                        <div 
                          className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed"
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Material de Apoyo para esta clase</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Array.isArray(currentLesson.resources) ? currentLesson.resources : Object.values(currentLesson.resources)).map((resource: any, idx: number) => (
                      <a
                        key={resource.id || idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-850 hover:border-slate-700 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl">📎</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-200 text-sm truncate group-hover:text-white">
                              {resource.title || resource.name || "Descargar Recurso"}
                            </p>
                            {resource.description && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">{resource.description}</p>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Column: Dynamic Course Index & Lessons */}
        <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/30 backdrop-blur-md overflow-y-auto">
          <div className="p-5 border-b border-slate-800 sticky top-0 bg-slate-900/90 z-20">
            <h3 className="font-bold text-base text-white">Programa de Estudios</h3>
            <p className="text-xs text-slate-400 mt-1">Explora las clases del curso</p>
          </div>

          <div className="p-3 space-y-2">
            {course.sections.map((section, sIdx) => {
              const isExpanded = expandedSections.has(section.id);
              const totalSecLessons = section.lessons?.length || 0;
              const freeSecLessons = section.lessons?.filter(l => l.is_free_preview).length || 0;

              return (
                <div key={section.id} className="border border-slate-800/40 rounded-xl overflow-hidden bg-slate-950/20">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                          Módulo {sIdx + 1}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-200 truncate pr-2">
                          {section.title}
                        </h4>
                      </div>
                    </div>
                    {freeSecLessons > 0 && (
                      <Badge className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/15 border-indigo-500/20 text-[10px] shrink-0 font-medium py-0.5">
                        {freeSecLessons} {freeSecLessons === 1 ? "gratis" : "gratis"}
                      </Badge>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-800/30 bg-slate-950/40 p-1.5 space-y-1">
                      {section.lessons?.map((lesson, lIdx) => {
                        const isCurrent = currentLesson?.id === lesson.id;
                        const isFree = lesson.is_free_preview;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonClick(lesson)}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                              isCurrent
                                ? "bg-indigo-600/15 border-l-4 border-indigo-500 text-white"
                                : "hover:bg-slate-900/50 text-slate-300 hover:text-white"
                            }`}
                          >
                            {isFree ? (
                              <Play className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isCurrent ? "text-indigo-400" : "text-emerald-400"}`} />
                            ) : (
                              <Lock className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs font-semibold ${isCurrent ? "text-white" : "text-slate-200"}`}>
                                  {lIdx + 1}. {lesson.title}
                                </p>
                                {isFree && !isCurrent && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20 uppercase shrink-0 tracking-wider">
                                    Gratis
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                                {lesson.duration_minutes && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    {lesson.duration_minutes} min
                                  </span>
                                )}
                                {lesson.has_quiz && (
                                  <span className="text-amber-500 flex items-center gap-1">
                                    • Evaluado
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {(!section.lessons || section.lessons.length === 0) && (
                        <p className="text-xs text-slate-500 text-center py-3">Sin lecciones disponibles</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </main>

      {/* ── PREMIUM LOCKED ACTION DIALOG ──────────────────────────────────────── */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-100 max-w-md p-6 rounded-2xl overflow-hidden">
          <DialogHeader className="text-center space-y-4">
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 mb-2">
              <Lock className="w-6 h-6 animate-bounce" />
            </div>
            <DialogTitle className="text-2xl font-extrabold text-white tracking-tight">
              {selectedLockedLesson ? `Desbloquear "${selectedLockedLesson.title}"` : "Acceso Completo al Curso"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
              Inscríbete hoy mismo y obtén acceso instantáneo a todas las lecciones del curso, incluyendo:
            </DialogDescription>
          </DialogHeader>

          {/* Premium Value Props list */}
          <div className="my-5 space-y-3.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">Acceso de por vida ilimitado</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Aprende a tu propio ritmo, desde cualquier dispositivo.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">Certificación Oficial</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Recibe tu certificado descargable con validez curricular al completar.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">Ejercicios y Evaluaciones</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Pon a prueba tus conocimientos con cuestionarios interactivos.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
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
              className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-xs font-medium py-2 rounded-lg"
            >
              Seguir explorando clases gratis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
