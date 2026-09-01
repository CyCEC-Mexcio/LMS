"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  GraduationCap,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { StudentContactButton } from "@/components/teacher/student-contact-button";

export interface StudentProgressItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  courseId: string;
  courseTitle: string;
  purchasedAt: string;
  completedLessons: number;
  totalLessons: number;
  progressPct: number;
}

interface StudentsProgressTrackerProps {
  initialStudents: StudentProgressItem[];
  courses: { id: string; title: string }[];
}

export function StudentsProgressTracker({
  initialStudents,
  courses,
}: StudentsProgressTrackerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  // Summary stats computed directly from initialStudents
  const stats = useMemo(() => {
    const total = initialStudents.length;
    const completed = initialStudents.filter((s) => s.progressPct === 100).length;
    const atRisk = initialStudents.filter(
      (s) => s.progressPct > 0 && s.progressPct < 40
    ).length;
    const inProgress = initialStudents.filter(
      (s) => s.progressPct >= 40 && s.progressPct < 100
    ).length;
    const notStarted = initialStudents.filter((s) => s.progressPct === 0).length;
    const avgProgress =
      total > 0
        ? Math.round(
            initialStudents.reduce((acc, s) => acc + s.progressPct, 0) / total
          )
        : 0;

    return {
      total,
      completed,
      atRisk,
      inProgress,
      notStarted,
      avgProgress,
    };
  }, [initialStudents]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    return initialStudents
      .filter((student) => {
        // Course filter
        if (selectedCourse !== "all" && student.courseId !== selectedCourse) {
          return false;
        }

        // Status filter
        if (selectedStatus === "completed" && student.progressPct !== 100) {
          return false;
        }
        if (
          selectedStatus === "in_progress" &&
          (student.progressPct < 40 || student.progressPct === 100)
        ) {
          return false;
        }
        if (
          selectedStatus === "at_risk" &&
          (student.progressPct === 0 || student.progressPct >= 40)
        ) {
          return false;
        }
        if (selectedStatus === "not_started" && student.progressPct !== 0) {
          return false;
        }

        // Search query filter (name or email)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = student.studentName.toLowerCase().includes(q);
          const emailMatch = student.studentEmail.toLowerCase().includes(q);
          const courseMatch = student.courseTitle.toLowerCase().includes(q);
          if (!nameMatch && !emailMatch && !courseMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortDirection === "desc") {
          return b.progressPct - a.progressPct || a.studentName.localeCompare(b.studentName);
        } else {
          return a.progressPct - b.progressPct || a.studentName.localeCompare(b.studentName);
        }
      });
  }, [initialStudents, selectedCourse, selectedStatus, searchQuery, sortDirection]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCourse("all");
    setSelectedStatus("all");
    setSortDirection("desc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedCourse !== "all" || selectedStatus !== "all";

  return (
    <div className="space-y-6">
      {/* ── 1. Summary Statistics Row ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Total Alumnos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Inscripciones registradas</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-gray-500 mt-1">100% de lecciones terminadas</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              En Riesgo (&lt;40%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.atRisk}</div>
            <p className="text-xs text-gray-500 mt-1">Requieren seguimiento o apoyo</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-600" />
              Progreso Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.avgProgress}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Avance global del grupo</p>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Filters & Search Controls ─────────────────────────── */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Buscar por nombre, correo o curso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-10 bg-white w-full text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 p-1"
                  title="Borrar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter controls row */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              {/* Course Filter Dropdown with Radix Select (guarantees cross-browser truncation) */}
              <div className="w-full sm:w-60 md:w-64">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="h-10 w-full bg-white text-xs sm:text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen size={14} className="text-gray-500 shrink-0" />
                      <SelectValue placeholder="Filtrar por curso" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-w-[320px] sm:max-w-md bg-white">
                    <SelectItem value="all">
                      Todos los Cursos ({courses.length})
                    </SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter Dropdown */}
              <div className="w-full sm:w-48">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-10 w-full bg-white text-xs sm:text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <Filter size={14} className="text-gray-500 shrink-0" />
                      <SelectValue placeholder="Estado" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    <SelectItem value="completed">Completado (100%)</SelectItem>
                    <SelectItem value="in_progress">En Progreso (&ge;40%)</SelectItem>
                    <SelectItem value="at_risk">En Riesgo (&lt;40%)</SelectItem>
                    <SelectItem value="not_started">Sin Iniciar (0%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Direction Toggle */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
                }
                className="h-10 gap-1.5 text-xs text-gray-700 bg-white shrink-0"
                title="Ordenar por porcentaje de progreso"
              >
                <ArrowUpDown size={14} />
                <span>
                  {sortDirection === "desc" ? "Mayor %" : "Menor %"}
                </span>
              </Button>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-10 text-xs text-gray-500 hover:text-red-600 gap-1 shrink-0 px-2.5"
                >
                  <RotateCcw size={13} />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Table / Empty States ──────────────────────────────── */}
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5 text-[#C4161C]" />
              Progreso y Seguimiento de Estudiantes
            </CardTitle>
            <span className="text-xs font-medium text-gray-500">
              Mostrando {filteredStudents.length} de {initialStudents.length} alumno
              {initialStudents.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {initialStudents.length === 0 ? (
            /* Empty state 1: Teacher has zero enrolled students across all courses */
            <div className="text-center py-16 px-4">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                Aún no hay estudiantes inscritos en tus cursos.
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Cuando los alumnos se inscriban a tus cursos publicados, aquí podrás ver su avance detallado y contactarlos directamente.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            /* Empty state 2: Active filters returned no matching students */
            <div className="text-center py-16 px-4">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                No se encontraron estudiantes con los filtros seleccionados.
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                Prueba cambiando el término de búsqueda, seleccionando otro curso o restableciendo los filtros.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="gap-1.5 text-xs"
              >
                <RotateCcw size={13} />
                Restablecer filtros
              </Button>
            </div>
          ) : (
            /* Table with matching student records */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/75">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Estudiante
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Curso
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Progreso
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Estado
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Contacto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st) => (
                    <tr
                      key={st.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {st.studentAvatar ? (
                            <img
                              src={st.studentAvatar}
                              alt={st.studentName}
                              className="w-9 h-9 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-[#C4161C] font-bold text-sm">
                              {st.studentName[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              {st.studentName}
                            </p>
                            {st.studentEmail ? (
                              <p className="text-xs text-gray-500 font-medium">
                                {st.studentEmail}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">
                                Sin correo registrado
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-gray-800">
                        {st.courseTitle}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="w-36 mx-auto space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>
                              {st.completedLessons}/{st.totalLessons} lecciones
                            </span>
                            <span className="font-bold text-[#C4161C]">
                              {st.progressPct}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#C4161C] h-2 rounded-full transition-all"
                              style={{ width: `${st.progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {st.progressPct === 100 ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Completado
                          </Badge>
                        ) : st.progressPct >= 40 ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            En Progreso
                          </Badge>
                        ) : st.progressPct > 0 ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            En Riesgo (&lt;40%)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Sin Iniciar
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <StudentContactButton
                          studentName={st.studentName}
                          studentEmail={st.studentEmail}
                          courseTitle={st.courseTitle}
                          progressPct={st.progressPct}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
