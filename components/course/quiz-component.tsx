// components/course/quiz-component.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type QuizQuestion = {
  id: string;
  question: string;
  question_type: "multiple_choice" | "true_false";
  options: { [key: string]: string };
  correct_answer: string;
  explanation: string | null;
  position: number;
  allow_multiple?: boolean;
};

type Quiz = {
  id: string;
  title: string;
  passing_score: number;
  quiz_questions: QuizQuestion[];
};

export default function QuizComponent({
  quiz,
  studentId,
  onComplete,
}: {
  quiz: Quiz;
  studentId: string;
  onComplete: (passed: boolean, score: number) => void;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string | string[] }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const sortedQuestions = [...quiz.quiz_questions].sort((a, b) => a.position - b.position);
  const currentQuestion = sortedQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === sortedQuestions.length - 1;

  // Check if question allows multiple answers
  const allowsMultiple = currentQuestion.question_type === "multiple_choice" && 
                         (currentQuestion.allow_multiple === true);

  const handleAnswerSelect = (answer: string) => {
    if (allowsMultiple) {
      // For multiple choice questions
      const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
      const newAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter((a) => a !== answer)
        : [...currentAnswers, answer];
      
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: newAnswers,
      }));
    } else {
      // For single choice questions
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: answer,
      }));
    }
  };

  const isAnswerSelected = (answer: string): boolean => {
    const currentAnswer = answers[currentQuestion.id];
    if (allowsMultiple) {
      return Array.isArray(currentAnswer) && currentAnswer.includes(answer);
    }
    return currentAnswer === answer;
  };

  const hasAnswered = (): boolean => {
    const currentAnswer = answers[currentQuestion.id];
    if (allowsMultiple) {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }
    return !!currentAnswer;
  };

  const handleNext = () => {
    if (isLastQuestion) {
      submitQuiz();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const normalizeAnswer = (answer: string): string[] => {
    // Handle array format like ["TEST"] or comma-separated
    try {
      // Try to parse as JSON array
      if (answer.startsWith('[') && answer.endsWith(']')) {
        const parsed = JSON.parse(answer);
        return Array.isArray(parsed) ? parsed : [answer];
      }
    } catch (e) {
      // Not JSON, continue
    }
    
    // Handle comma-separated values
    if (answer.includes(',')) {
      return answer.split(',').map(a => a.trim());
    }
    
    // Single value
    return [answer];
  };

  const checkAnswer = (questionId: string, studentAnswer: string | string[], correctAnswer: string): boolean => {
    const correctAnswers = normalizeAnswer(correctAnswer);
    
    if (Array.isArray(studentAnswer)) {
      // Multiple choice - check if arrays match (order doesn't matter)
      if (studentAnswer.length !== correctAnswers.length) return false;
      const sorted1 = [...studentAnswer].sort();
      const sorted2 = [...correctAnswers].sort();
      return sorted1.every((val, idx) => val === sorted2[idx]);
    } else {
      // Single choice - check if answer is in correct answers
      return correctAnswers.includes(studentAnswer);
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);

    // Calculate score
    let correctCount = 0;
    sortedQuestions.forEach((q) => {
      const studentAnswer = answers[q.id];
      if (studentAnswer && checkAnswer(q.id, studentAnswer, q.correct_answer)) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / sortedQuestions.length) * 100);
    const quizPassed = calculatedScore >= quiz.passing_score;

    setScore(calculatedScore);
    setPassed(quizPassed);
    setShowResults(true);

    // Save quiz attempt
    try {
      const { error } = await supabase.from("quiz_attempts").insert({
        student_id: studentId,
        quiz_id: quiz.id,
        score: calculatedScore,
        passed: quizPassed,
        answers,
      });

      if (error) {
        console.error("Error saving quiz attempt:", error);
      }
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
    }

    setSubmitting(false);
  };

  const retakeQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setScore(0);
    setPassed(false);
  };

  const handleContinue = () => {
    onComplete(passed, score);
  };

  const formatStudentAnswer = (answer: string | string[] | undefined): string => {
    if (!answer) return "Sin responder";
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    return answer;
  };

  const formatCorrectAnswer = (correctAnswer: string): string => {
    const normalized = normalizeAnswer(correctAnswer);
    return normalized.join(", ");
  };

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados del Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {passed ? (
              <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
            ) : (
              <XCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
            )}

            <h3 className="text-2xl font-bold mb-2">
              {passed ? "¡Felicidades! Aprobaste" : "No aprobaste esta vez"}
            </h3>

            <p className="text-4xl font-bold mb-4">
              {score}%
            </p>

            <p className="text-gray-600 mb-2">
              Puntaje requerido: {quiz.passing_score}%
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              Respondiste correctamente {Math.round((score / 100) * sortedQuestions.length)} de {sortedQuestions.length} preguntas
            </p>

            {!passed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-left">
                    <p className="font-medium text-yellow-800">Debes aprobar este quiz para continuar</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Revisa tus respuestas incorrectas y vuelve a intentarlo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {sortedQuestions.map((q, idx) => {
                const studentAnswer = answers[q.id];
                const isCorrect = studentAnswer && checkAnswer(q.id, studentAnswer, q.correct_answer);
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded border-l-4 text-left ${
                      isCorrect
                        ? "bg-green-50 border-green-600"
                        : "bg-red-50 border-red-600"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="font-medium">{idx + 1}. {q.question}</p>
                    </div>
                    <div className="ml-7">
                      <p className="text-sm text-gray-600">
                        Tu respuesta: <strong>{formatStudentAnswer(studentAnswer)}</strong>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-gray-600 mt-1">
                          Respuesta correcta: <strong>{formatCorrectAnswer(q.correct_answer)}</strong>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-sm text-gray-700 mt-2 italic bg-white/50 p-2 rounded">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center">
              {passed ? (
                <Button onClick={handleContinue} size="lg" className="bg-green-600 hover:bg-green-700">
                  Continuar a la siguiente lección
                </Button>
              ) : (
                <Button onClick={retakeQuiz} size="lg">
                  Reintentar Quiz
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{quiz.title}</CardTitle>
          <span className="text-sm text-gray-600">
            Pregunta {currentQuestionIndex + 1} de {sortedQuestions.length}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Necesitas {quiz.passing_score}% para aprobar
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestionIndex + 1) / sortedQuestions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question */}
          <div>
            <h3 className="text-xl font-semibold mb-2">{currentQuestion.question}</h3>
            {allowsMultiple && (
              <p className="text-sm text-blue-600 mb-4">
                ⓘ Selecciona todas las respuestas correctas
              </p>
            )}

            {allowsMultiple ? (
              // Multiple choice with checkboxes
              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <div
                    key={key}
                    onClick={() => handleAnswerSelect(value as string)}
                    className={`flex items-center space-x-3 p-4 border rounded cursor-pointer transition-colors ${
                      isAnswerSelected(value as string)
                        ? "bg-blue-50 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      checked={isAnswerSelected(value as string)}
                      onCheckedChange={() => handleAnswerSelect(value as string)}
                      id={`${currentQuestion.id}-${key}`}
                    />
                    <Label
                      htmlFor={`${currentQuestion.id}-${key}`}
                      className="flex-1 cursor-pointer"
                    >
                      {value as string}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              // Single choice with radio buttons
              <RadioGroup
                value={answers[currentQuestion.id] as string || ""}
                onValueChange={handleAnswerSelect}
              >
                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <div
                      key={key}
                      onClick={() => handleAnswerSelect(value as string)}
                      className={`flex items-center space-x-3 p-4 border rounded cursor-pointer transition-colors ${
                        isAnswerSelected(value as string)
                          ? "bg-blue-50 border-blue-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <RadioGroupItem 
                        value={value as string} 
                        id={`${currentQuestion.id}-${key}`}
                      />
                      <Label
                        htmlFor={`${currentQuestion.id}-${key}`}
                        className="flex-1 cursor-pointer"
                      >
                        {value as string}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={!hasAnswered() || submitting}
            >
              {submitting ? "Enviando..." : isLastQuestion ? "Enviar Quiz" : "Siguiente"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}