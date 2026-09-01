"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  BookOpen,
  GraduationCap,
  Search,
  ChevronDown,
  ChevronUp,
  UserMinus,
  Loader2,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { RemoveStudentDialog } from "@/components/admin/remove-student-dialog";
import Link from "next/link";

export interface TeacherSummaryItem {
  id: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  coursesCount: number;
  totalStudentsCount: number;
  createdAt: string;
}

export interface CourseStudentItem {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  purchasedAt: string;
  amountPaid: number;
  completedLessons: number;
  totalLessons: number;
  progressPct: number;
}

export interface TeacherCourseDetail {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: number;
  isPublished: boolean;
  isApproved: boolean;
  totalLessons: number;
  studentCount: number;
  students: CourseStudentItem[];
}

interface TeacherHierarchyManagerProps {
  initialTeachers: TeacherSummaryItem[];
}

export function TeacherHierarchyManager({
  initialTeachers,
}: TeacherHierarchyManagerProps) {
  const [teachers, setTeachers] = useState<TeacherSummaryItem[]>(initialTeachers);
  const [searchQuery, setSearchQuery] = useState("");

  // Track expanded teachers: teacherId -> boolean
  const [expandedTeacherIds, setExpandedTeacherIds] = useState<Record<string, boolean>>({});

  // Track loaded details cache: teacherId -> TeacherCourseDetail[]
  const [teacherDetailsCache, setTeacherDetailsCache] = useState<
    Record<string, TeacherCourseDetail[]>
  >({});

  // Track loading state per teacherId
  const [loadingTeacherIds, setLoadingTeacherIds] = useState<Record<string, boolean>>({});

  // Track expanded courses within teachers: courseId -> boolean
  const [expandedCourseIds, setExpandedCourseIds] = useState<Record<string, boolean>>({});

  // Removal Dialog State
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    studentEmail?: string;
    courseId: string;
    courseTitle: string;
    teacherId: string;
  }>({
    isOpen: false,
    studentId: "",
    studentName: "",
    studentEmail: "",
    courseId: "",
    courseTitle: "",
    teacherId: "",
  });

  // Global summary metrics
  const totalInstructors = teachers.length;
  const totalCourses = teachers.reduce((sum, t) => sum + t.coursesCount, 0);
  const totalEnrollments = teachers.reduce((sum, t) => sum + t.totalStudentsCount, 0);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase().trim();
    return teachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        (t.email && t.email.toLowerCase().includes(q))
    );
  }, [teachers, searchQuery]);

  // Toggle teacher expansion & lazy load details
  const toggleTeacher = async (teacherId: string) => {
    const isCurrentlyExpanded = !!expandedTeacherIds[teacherId];

    if (isCurrentlyExpanded) {
      setExpandedTeacherIds((prev) => ({ ...prev, [teacherId]: false }));
      return;
    }

    setExpandedTeacherIds((prev) => ({ ...prev, [teacherId]: true }));

    // If already cached, do not refetch
    if (teacherDetailsCache[teacherId]) {
      return;
    }

    // Lazy load teacher details
    setLoadingTeacherIds((prev) => ({ ...prev, [teacherId]: true }));
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/details`);
      const data = await res.json();

      if (res.ok && data.courses) {
        setTeacherDetailsCache((prev) => ({
          ...prev,
          [teacherId]: data.courses,
        }));
        // Auto-expand first course if there is only 1 course
        if (data.courses.length === 1) {
          setExpandedCourseIds((prev) => ({ ...prev, [data.courses[0].id]: true }));
        }
      }
    } catch (err) {
      console.error("Error lazy loading teacher courses:", err);
    } finally {
      setLoadingTeacherIds((prev) => ({ ...prev, [teacherId]: false }));
    }
  };

  // Toggle course accordion
  const toggleCourse = (courseId: string) => {
    setExpandedCourseIds((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  // Open unenroll confirmation modal
  const openRemoveDialog = (
    teacherId: string,
    courseId: string,
    courseTitle: string,
    student: CourseStudentItem
  ) => {
    setDialogState({
      isOpen: true,
      teacherId,
      courseId,
      courseTitle,
      studentId: student.studentId,
      studentName: student.studentName,
      studentEmail: student.studentEmail,
    });
  };

  // Handle successful student unenrollment: update local state without page reload
  const handleStudentRemoved = (removedCourseId: string, removedStudentId: string) => {
    const { teacherId } = dialogState;

    // 1. Update teacher details cache
    setTeacherDetailsCache((prev) => {
      const currentCourses = prev[teacherId];
      if (!currentCourses) return prev;

      const updatedCourses = currentCourses.map((course) => {
        if (course.id !== removedCourseId) return course;
        const updatedStudents = course.students.filter(
          (s) => s.studentId !== removedStudentId
        );
        return {
          ...course,
          studentCount: updatedStudents.length,
          students: updatedStudents,
        };
      });

      return {
        ...prev,
        [teacherId]: updatedCourses,
      };
    });

    // 2. Decrement teacher's total student count in the summary list
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== teacherId) return t;
        return {
          ...t,
          totalStudentsCount: Math.max(0, t.totalStudentsCount - 1),
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Overview Summary Stats ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users size={16} className="text-purple-600" />
              Total Instructores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{totalInstructors}</div>
            <p className="text-xs text-gray-500 mt-1">Profesores registrados</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600" />
              Total Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalCourses}</div>
            <p className="text-xs text-gray-500 mt-1">Cursos creados</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <GraduationCap size={16} className="text-green-600" />
              Inscripciones Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalEnrollments}</div>
            <p className="text-xs text-gray-500 mt-1">Alumnos en todos los cursos</p>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Search Filter ─────────────────────────────────────── */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Buscar instructor por nombre o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Drill-Down Hierarchy List ─────────────────────────── */}
      <div className="space-y-4">
        {filteredTeachers.length === 0 ? (
          <Card className="border border-gray-200 text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                No se encontraron instructores
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Prueba cambiando el término de búsqueda."
                  : "Aún no hay usuarios con rol de profesor registrados en la plataforma."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTeachers.map((teacher) => {
            const isExpanded = !!expandedTeacherIds[teacher.id];
            const isLoadingDetails = !!loadingTeacherIds[teacher.id];
            const courses = teacherDetailsCache[teacher.id] || [];

            return (
              <Card
                key={teacher.id}
                className="border border-gray-200 overflow-hidden shadow-xs transition-shadow hover:shadow-md"
              >
                {/* Level 1: Teacher Header Row */}
                <div
                  onClick={() => toggleTeacher(teacher.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-white hover:bg-gray-50/75 transition-colors select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {teacher.avatarUrl ? (
                      <img
                        src={teacher.avatarUrl}
                        alt={teacher.fullName}
                        className="w-11 h-11 rounded-full object-cover border shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-base shrink-0">
                        {teacher.fullName[0]?.toUpperCase() || "P"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-gray-900 truncate">
                          {teacher.fullName}
                        </h3>
                        <Badge variant="outline" className="text-xs text-purple-700 border-purple-200 bg-purple-50">
                          Instructor
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {teacher.email || "Sin correo"} · Registrado{" "}
                        {new Date(teacher.createdAt).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <BookOpen size={14} className="text-blue-600" />
                      <span>{teacher.coursesCount} cursos</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <GraduationCap size={14} className="text-green-600" />
                      <span>{teacher.totalStudentsCount} alumnos</span>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-gray-500 hover:text-gray-900"
                    >
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Level 2: Expanded Teacher Courses List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6 space-y-4">
                    {isLoadingDetails ? (
                      <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        <span className="text-sm font-medium">Cargando cursos y alumnos...</span>
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        Este instructor aún no tiene cursos creados.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Cursos del Instructor ({courses.length})
                        </p>

                        {courses.map((course) => {
                          const isCourseExpanded = !!expandedCourseIds[course.id];

                          return (
                            <div
                              key={course.id}
                              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs"
                            >
                              {/* Course Item Header */}
                              <div
                                onClick={() => toggleCourse(course.id)}
                                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/75 transition-colors select-none"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {course.thumbnailUrl ? (
                                    <img
                                      src={course.thumbnailUrl}
                                      alt={course.title}
                                      className="w-14 h-10 object-cover rounded-md border shrink-0"
                                    />
                                  ) : (
                                    <div className="w-14 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                      <BookOpen size={16} />
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                                        {course.title}
                                      </h4>
                                      <Badge
                                        variant={course.isPublished ? "default" : "secondary"}
                                        className={
                                          course.isPublished
                                            ? "bg-green-100 text-green-800 text-[10px] px-1.5 py-0"
                                            : "bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0"
                                        }
                                      >
                                        {course.isPublished ? "Publicado" : "Borrador"}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      ${Number(course.price).toLocaleString("es-MX")} MXN ·{" "}
                                      {course.totalLessons} lecciones
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs gap-1 py-1"
                                  >
                                    <Users size={12} />
                                    {course.studentCount} alumno
                                    {course.studentCount !== 1 ? "s" : ""}
                                  </Badge>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-gray-400"
                                  >
                                    {isCourseExpanded ? (
                                      <ChevronUp size={16} />
                                    ) : (
                                      <ChevronDown size={16} />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Level 3: Enrolled Students Table & Removal Action */}
                              {isCourseExpanded && (
                                <div className="border-t border-gray-100 bg-gray-50/75 p-3 sm:p-4">
                                  {course.students.length === 0 ? (
                                    <p className="text-xs text-gray-500 text-center py-4">
                                      No hay estudiantes inscritos en este curso.
                                    </p>
                                  ) : (
                                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-b bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                            <th className="py-2.5 px-3">Estudiante</th>
                                            <th className="py-2.5 px-3">Inscripción</th>
                                            <th className="py-2.5 px-3 text-center">Progreso</th>
                                            <th className="py-2.5 px-3 text-center">Acción</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {course.students.map((st) => (
                                            <tr
                                              key={st.enrollmentId}
                                              className="hover:bg-gray-50/75 transition-colors text-xs"
                                            >
                                              {/* Student Name & Email */}
                                              <td className="py-3 px-3">
                                                <div className="flex items-center gap-2.5">
                                                  {st.studentAvatar ? (
                                                    <img
                                                      src={st.studentAvatar}
                                                      alt={st.studentName}
                                                      className="w-7 h-7 rounded-full object-cover border"
                                                    />
                                                  ) : (
                                                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-[#C4161C] font-bold text-xs">
                                                      {st.studentName[0]?.toUpperCase() || "?"}
                                                    </div>
                                                  )}
                                                  <div>
                                                    <p className="font-semibold text-gray-900">
                                                      {st.studentName}
                                                    </p>
                                                    {st.studentEmail && (
                                                      <p className="text-[11px] text-gray-500">
                                                        {st.studentEmail}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </td>

                                              {/* Purchase Date */}
                                              <td className="py-3 px-3 text-gray-600">
                                                {new Date(st.purchasedAt).toLocaleDateString(
                                                  "es-MX",
                                                  {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                  }
                                                )}
                                              </td>

                                              {/* Progress Bar */}
                                              <td className="py-3 px-3 text-center">
                                                <div className="w-28 mx-auto space-y-1">
                                                  <div className="flex justify-between text-[11px] text-gray-600">
                                                    <span>
                                                      {st.completedLessons}/{st.totalLessons}
                                                    </span>
                                                    <span className="font-bold text-[#C4161C]">
                                                      {st.progressPct}%
                                                    </span>
                                                  </div>
                                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                      className="bg-[#C4161C] h-1.5 rounded-full transition-all"
                                                      style={{ width: `${st.progressPct}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              </td>

                                              {/* Destructive Action: Remove from course */}
                                              <td className="py-3 px-3 text-center">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() =>
                                                    openRemoveDialog(
                                                      teacher.id,
                                                      course.id,
                                                      course.title,
                                                      st
                                                    )
                                                  }
                                                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1 px-2"
                                                  title="Dar de baja a este estudiante del curso"
                                                >
                                                  <UserMinus size={13} />
                                                  <span>Dar de baja</span>
                                                </Button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ── 4. Remove Student Confirmation Dialog ─────────────────── */}
      <RemoveStudentDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        studentId={dialogState.studentId}
        studentName={dialogState.studentName}
        studentEmail={dialogState.studentEmail}
        courseId={dialogState.courseId}
        courseTitle={dialogState.courseTitle}
        onSuccess={handleStudentRemoved}
      />
    </div>
  );
}
