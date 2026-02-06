// components/course/course-player.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, ChevronRight, ChevronDown, PlayCircle, Lock, Award } from "lucide-react";
import VideoPlayer from "./video-player";
import QuizComponent from "./quiz-component";
import { useRouter } from "next/navigation";

type Quiz = {
  id: string;
  title: string;
  passing_score: number;
  quiz_questions: {
    id: string;
    question: string;
    question_type: "multiple_choice" | "true_false";
    options: { [key: string]: string };
    correct_answer: string;
    explanation: string | null;
    position: number;
  }[];
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
  sections: Section[];
};

type Progress = {
  lesson_id: string;
  is_completed: boolean;
  last_position_seconds: number;
};

type QuizAttempt = {
  quiz_id: string;
  passed: boolean;
  score: number;
};

export default function CoursePlayer({
  course,
  enrollmentId,
  studentId,
  progressData,
}: {
  course: Course;
  enrollmentId: string;
  studentId: string;
  progressData: Progress[];
}) {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Map<string, Progress>>(new Map());
  const [quizAttempts, setQuizAttempts] = useState<Map<string, QuizAttempt>>(new Map());
  const [showQuiz, setShowQuiz] = useState(false);
  const [completingCourse, setCompletingCourse] = useState(false);
  const [quizAttemptsLoaded, setQuizAttemptsLoaded] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  // Memoize progress map initialization
  useEffect(() => {
    const progressMap = new Map<string, Progress>();
    progressData.forEach((p) => {
      progressMap.set(p.lesson_id, p);
    });
    setProgress(progressMap);
  }, [progressData]);

  // Memoize all lessons (flatten once)
  const allLessons = useMemo(() => {
    return course.sections.flatMap((s) => s.lessons);
  }, [course.sections]);

  // Memoize quiz IDs
  const allQuizIds = useMemo(() => {
    return allLessons
      .filter((l) => l.has_quiz && l.quizzes.length > 0)
      .map((l) => l.quizzes[0].id);
  }, [allLessons]);

  // Fetch quiz attempts ONCE
  useEffect(() => {
    if (allQuizIds.length === 0 || quizAttemptsLoaded) return;

    const fetchQuizAttempts = async () => {
      try {
        const { data } = await supabase
          .from("quiz_attempts")
          .select("quiz_id, passed, score")
          .eq("student_id", studentId)
          .in("quiz_id", allQuizIds)
          .order("attempted_at", { ascending: false });

        if (data) {
          const attemptsMap = new Map<string, QuizAttempt>();
          data.forEach((attempt) => {
            if (!attemptsMap.has(attempt.quiz_id)) {
              attemptsMap.set(attempt.quiz_id, attempt);
            }
          });
          setQuizAttempts(attemptsMap);
        }
      } catch (error) {
        console.error("Error fetching quiz attempts:", error);
      } finally {
        setQuizAttemptsLoaded(true);
      }
    };

    fetchQuizAttempts();
  }, [allQuizIds, studentId, supabase, quizAttemptsLoaded]);

  // Memoize lesson completion check
  const isLessonFullyCompleted = useCallback((lesson: Lesson): boolean => {
    const lessonProgress = progress.get(lesson.id);
    const isProgressComplete = lessonProgress?.is_completed || false;

    if (!isProgressComplete) return false;

    if (lesson.has_quiz && lesson.quizzes.length > 0) {
      const quizAttempt = quizAttempts.get(lesson.quizzes[0].id);
      return quizAttempt?.passed || false;
    }

    return true;
  }, [progress, quizAttempts]);

  // Memoize unlock status
  const isLessonUnlocked = useCallback((lessonId: string): boolean => {
    const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
    if (lessonIndex === 0) return true;

    for (let i = 0; i < lessonIndex; i++) {
      if (!isLessonFullyCompleted(allLessons[i])) {
        return false;
      }
    }

    return true;
  }, [allLessons, isLessonFullyCompleted]);

  // Memoize course progress calculation
  const courseProgress = useMemo(() => {
    const completedCount = allLessons.filter((lesson) => 
      isLessonFullyCompleted(lesson)
    ).length;
    return allLessons.length > 0 
      ? Math.round((completedCount / allLessons.length) * 100) 
      : 0;
  }, [allLessons, isLessonFullyCompleted]);

  const completedLessonsCount = useMemo(() => {
    return allLessons.filter((lesson) => isLessonFullyCompleted(lesson)).length;
  }, [allLessons, isLessonFullyCompleted]);

  // Set initial lesson - only run when dependencies actually change
  useEffect(() => {
    if (course.sections.length === 0 || !quizAttemptsLoaded) return;
    if (currentLesson) return; // Don't reset if already set

    let firstIncompleteLesson: Lesson | null = null;
    let firstIncompleteSection: Section | null = null;
    let shouldShowQuiz = false;

    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        const isComplete = isLessonFullyCompleted(lesson);
        if (!isComplete) {
          firstIncompleteLesson = lesson;
          firstIncompleteSection = section;
          
          const lessonProgress = progress.get(lesson.id);
          if (lessonProgress?.is_completed && lesson.has_quiz && lesson.quizzes.length > 0) {
            const quizAttempt = quizAttempts.get(lesson.quizzes[0].id);
            if (!quizAttempt?.passed) {
              shouldShowQuiz = true;
            }
          }
          
          break;
        }
      }
      if (firstIncompleteLesson) break;
    }

    if (!firstIncompleteLesson) {
      firstIncompleteLesson = course.sections[0].lessons[0];
      firstIncompleteSection = course.sections[0];
    }

    setCurrentLesson(firstIncompleteLesson);
    setCurrentSection(firstIncompleteSection);
    setShowQuiz(shouldShowQuiz);
    setExpandedSections(new Set([firstIncompleteSection.id]));
  }, [course, progress, quizAttempts, quizAttemptsLoaded]);

  const isLastLesson = useCallback((): boolean => {
    if (!currentLesson) return false;
    const lastLesson = allLessons[allLessons.length - 1];
    return currentLesson.id === lastLesson.id;
  }, [currentLesson, allLessons]);

  const isAllLessonsComplete = useCallback((): boolean => {
    return allLessons.every((lesson) => isLessonFullyCompleted(lesson));
  }, [allLessons, isLessonFullyCompleted]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const selectLesson = useCallback((lesson: Lesson, section: Section) => {
    if (!isLessonUnlocked(lesson.id)) {
      alert("Debes completar las lecciones anteriores primero.");
      return;
    }

    setCurrentLesson(lesson);
    setCurrentSection(section);
    
    const lessonProgress = progress.get(lesson.id);
    const shouldShowQuiz = lessonProgress?.is_completed && 
                          lesson.has_quiz && 
                          lesson.quizzes.length > 0 &&
                          !quizAttempts.get(lesson.quizzes[0].id)?.passed;
    
    setShowQuiz(shouldShowQuiz);
    setExpandedSections((prev) => new Set(prev).add(section.id));
  }, [progress, quizAttempts, isLessonUnlocked]);

  const markLessonComplete = async () => {
    if (!currentLesson) return;

    try {
      const { error } = await supabase
        .from("progress")
        .upsert({
          student_id: studentId,
          lesson_id: currentLesson.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id,lesson_id'
        });

      if (error) {
        console.error("Error marking lesson complete:", error);
        return;
      }

      setProgress((prev) => {
        const next = new Map(prev);
        next.set(currentLesson.id, {
          lesson_id: currentLesson.id,
          is_completed: true,
          last_position_seconds: 0,
        });
        return next;
      });

      if (currentLesson.has_quiz && currentLesson.quizzes.length > 0) {
        setShowQuiz(true);
      } else if (!isLastLesson()) {
        goToNextLesson();
      }
    } catch (error) {
      console.error("Error marking lesson complete:", error);
    }
  };

  const handleQuizComplete = useCallback((passed: boolean, quizId: string, score: number) => {
    setQuizAttempts((prev) => {
      const next = new Map(prev);
      next.set(quizId, { quiz_id: quizId, passed, score });
      return next;
    });

    if (passed) {
      setTimeout(() => {
        setShowQuiz(false);
        if (!isLastLesson()) {
          goToNextLesson();
        }
      }, 2000);
    }
  }, [isLastLesson]);

  const goToNextLesson = useCallback(() => {
    if (!currentSection || !currentLesson) return;

    const allLessonsWithSections: { lesson: Lesson; section: Section }[] = [];
    course.sections.forEach((section) => {
      section.lessons.forEach((lesson) => {
        allLessonsWithSections.push({ lesson, section });
      });
    });

    const currentIndex = allLessonsWithSections.findIndex(
      (item) => item.lesson.id === currentLesson.id
    );

    if (currentIndex < allLessonsWithSections.length - 1) {
      const nextItem = allLessonsWithSections[currentIndex + 1];
      if (isLessonUnlocked(nextItem.lesson.id)) {
        selectLesson(nextItem.lesson, nextItem.section);
      }
    }
  }, [currentSection, currentLesson, course.sections, isLessonUnlocked, selectLesson]);

  const completeCourse = async () => {
    setCompletingCourse(true);

    try {
      const { data: existingCert } = await supabase
        .from("certificates")
        .select("id")
        .eq("student_id", studentId)
        .eq("course_id", course.id)
        .single();

      if (!existingCert) {
        const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const { error } = await supabase.from("certificates").insert({
          student_id: studentId,
          course_id: course.id,
          certificate_number: certificateNumber,
        });

        if (error) {
          console.error("Error creating certificate:", error);
          alert("Error al crear el certificado. Por favor intenta de nuevo.");
          setCompletingCourse(false);
          return;
        }
      }

      alert("🎉 ¡Felicidades! Has completado el curso exitosamente.\n\nTu certificado está disponible en la sección 'Mis Certificados'.");
      router.push("/student/certificates");
    } catch (error) {
      console.error("Error completing course:", error);
      alert("Error al completar el curso. Por favor intenta de nuevo.");
      setCompletingCourse(false);
    }
  };

  if (!currentLesson || !currentSection || !quizAttemptsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando curso...</p>
        </div>
      </div>
    );
  }

  const lessonProgress = progress.get(currentLesson.id);
  const isLessonComplete = lessonProgress?.is_completed || false;
  const currentLessonFullyComplete = isLessonFullyCompleted(currentLesson);
  const hasVideo = currentLesson.video_provider || currentLesson.video_url;
  const showCompleteCourseButton = isLastLesson() && currentLessonFullyComplete && isAllLessonsComplete();

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Progress Bar */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso del curso</span>
              <span className="text-sm font-bold text-blue-600">{courseProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${courseProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {completedLessonsCount} de {allLessons.length} lecciones completadas
            </p>
          </Card>

          {/* Lesson Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{currentLesson.title}</h1>
            <p className="text-gray-600">
              {currentSection.title} • Lección {currentLesson.position}
              {isLastLesson() && " • 🏁 Última lección"}
            </p>
          </div>

          {/* Complete Course Button */}
          {showCompleteCourseButton && (
            <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500">
              <div className="text-center">
                <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  ¡Has completado todas las lecciones!
                </h2>
                <p className="text-gray-700 mb-6">
                  Presiona el botón para finalizar el curso y obtener tu certificado
                </p>
                <Button 
                  onClick={completeCourse}
                  disabled={completingCourse}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                >
                  {completingCourse ? "Generando certificado..." : "🎓 Finalizar Curso y Obtener Certificado"}
                </Button>
              </div>
            </Card>
          )}

          {/* Show Quiz OR Show Video/Content */}
          {showQuiz && currentLesson.quizzes.length > 0 ? (
            <QuizComponent
              quiz={currentLesson.quizzes[0]}
              studentId={studentId}
              onComplete={(passed, score) => handleQuizComplete(passed, currentLesson.quizzes[0].id, score)}
            />
          ) : (
            <>
              {hasVideo && (
                <VideoPlayer
                  lesson={currentLesson}
                  onComplete={markLessonComplete}
                  isCompleted={isLessonComplete}
                />
              )}

              {!hasVideo && !isLessonComplete && (
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Lección de contenido</h3>
                      <p className="text-sm text-gray-600">
                        {currentLesson.has_quiz 
                          ? "Revisa el contenido y luego completa el quiz"
                          : "Revisa el contenido y marca como completada"
                        }
                      </p>
                    </div>
                    <Button onClick={markLessonComplete} size="lg">
                      {currentLesson.has_quiz ? "Continuar al Quiz" : "Marcar como completada"}
                    </Button>
                  </div>
                </Card>
              )}

              {isLessonComplete && !currentLessonFullyComplete && currentLesson.has_quiz && (
                <Card className="p-6 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Contenido completado</p>
                        <p className="text-sm text-green-700">Ahora completa el quiz para continuar</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowQuiz(true)} 
                      size="lg"
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Tomar Quiz
                    </Button>
                  </div>
                </Card>
              )}

              {currentLessonFullyComplete && !showCompleteCourseButton && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm font-medium">
                      ✓ Lección Completada
                      {currentLesson.has_quiz && " (Quiz Aprobado)"}
                    </p>
                  </div>
                </Card>
              )}
            </>
          )}

          {!showQuiz && currentLesson.description && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">Descripción</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{currentLesson.description}</p>
            </Card>
          )}

          {!showQuiz && currentLesson.content && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">Contenido</h2>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: currentLesson.content }}
              />
            </Card>
          )}

          {!showQuiz && currentLesson.resources && Object.keys(currentLesson.resources).length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">Recursos</h2>
              <div className="space-y-2">
                {Object.entries(currentLesson.resources).map(([key, value]: [string, any]) => (
                  <a
                    key={key}
                    href={value.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    📎 {value.name || key}
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Sidebar - Optimized */}
      <SidebarCurriculum 
        course={course}
        currentLesson={currentLesson}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        selectLesson={selectLesson}
        isLessonFullyCompleted={isLessonFullyCompleted}
        isLessonUnlocked={isLessonUnlocked}
      />
    </div>
  );
}

// Separate sidebar component to prevent re-renders
const SidebarCurriculum = ({
  course,
  currentLesson,
  expandedSections,
  toggleSection,
  selectLesson,
  isLessonFullyCompleted,
  isLessonUnlocked,
}: {
  course: Course;
  currentLesson: Lesson;
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  selectLesson: (lesson: Lesson, section: Section) => void;
  isLessonFullyCompleted: (lesson: Lesson) => boolean;
  isLessonUnlocked: (lessonId: string) => boolean;
}) => {
  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 className="font-bold text-lg">Contenido del Curso</h2>
        <p className="text-sm text-gray-600">{course.title}</p>
      </div>

      <div className="p-2">
        {course.sections.map((section, sectionIdx) => {
          const sectionLessons = section.lessons;
          const completedInSection = sectionLessons.filter((l) =>
            isLessonFullyCompleted(l)
          ).length;
          const isExpanded = expandedSections.has(section.id);

          return (
            <div key={section.id} className="mb-2">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="font-medium text-sm">
                    {sectionIdx + 1}. {section.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {completedInSection}/{sectionLessons.length}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-4 space-y-1">
                  {sectionLessons.map((lesson, lessonIdx) => {
                    const isComplete = isLessonFullyCompleted(lesson);
                    const isCurrent = currentLesson?.id === lesson.id;
                    const isUnlocked = isLessonUnlocked(lesson.id);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson, section)}
                        disabled={!isUnlocked}
                        className={`w-full flex items-center gap-3 p-2 rounded text-left transition-colors ${
                          isCurrent
                            ? "bg-blue-50 border-l-4 border-blue-600"
                            : isUnlocked
                            ? "hover:bg-gray-50"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                        ) : isUnlocked ? (
                          <Circle size={18} className="text-gray-400 flex-shrink-0" />
                        ) : (
                          <Lock size={18} className="text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isCurrent ? "font-semibold" : ""}`}>
                            {lessonIdx + 1}. {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {lesson.duration_minutes && (
                              <span>{lesson.duration_minutes} min</span>
                            )}
                            {lesson.has_quiz && (
                              <span className="text-orange-600">• Quiz</span>
                            )}
                          </div>
                        </div>
                        {isCurrent && <PlayCircle size={16} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};