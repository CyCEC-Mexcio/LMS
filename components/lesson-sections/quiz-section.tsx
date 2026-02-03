"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  GripVertical,
  Check,
  X
} from "lucide-react";

interface QuizSectionProps {
  lessonData: any;
  setLessonData: (data: any) => void;
  quizData: any;
  setQuizData: (data: any) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function QuizSection({
  lessonData,
  setLessonData,
  quizData,
  setQuizData,
  expanded,
  onToggle,
}: QuizSectionProps) {
  const toggleQuiz = (enabled: boolean) => {
    setLessonData({ ...lessonData, has_quiz: enabled });
    
    if (enabled && !quizData) {
      setQuizData({
        title: "Lesson Quiz",
        passing_score: 70,
        questions: [],
      });
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      question: "",
      question_type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: null,
      position: quizData.questions.length,
      allow_multiple: false,
    };

    setQuizData({
      ...quizData,
      questions: [...quizData.questions, newQuestion],
    });
  };

  const updateQuestion = (index: number, updates: any) => {
    const newQuestions = [...quizData.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = quizData.questions.filter((_: any, i: number) => i !== index);
    // Update positions
    newQuestions.forEach((q: any, i: number) => {
      q.position = i;
    });
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === quizData.questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...quizData.questions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];

    // Update positions
    newQuestions.forEach((q: any, i: number) => {
      q.position = i;
    });

    setQuizData({ ...quizData, questions: newQuestions });
  };

  const addOption = (questionIndex: number) => {
    const question = quizData.questions[questionIndex];
    updateQuestion(questionIndex, {
      options: [...(question.options || []), ""],
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = quizData.questions[questionIndex];
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: newOptions });
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = quizData.questions[questionIndex];
    const newOptions = (question.options || []).filter((_: any, i: number) => i !== optionIndex);
    updateQuestion(questionIndex, { options: newOptions });
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Quiz</h2>
              <p className="text-sm text-gray-600">
                {lessonData.has_quiz
                  ? `${quizData?.questions?.length || 0} questions`
                  : "Optional - Add quiz to test understanding"}
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 space-y-6 border-t">
          <div className="pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lessonData.has_quiz}
                onChange={(e) => toggleQuiz(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">Enable Quiz for this lesson</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Students must pass the quiz to unlock the next lesson
            </p>
          </div>

          {lessonData.has_quiz && quizData && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiz_title">Quiz Title</Label>
                  <Input
                    id="quiz_title"
                    value={quizData.title}
                    onChange={(e) =>
                      setQuizData({ ...quizData, title: e.target.value })
                    }
                    placeholder="e.g., Lesson 1 Quiz"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="passing_score">Passing Score (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={quizData.passing_score}
                    onChange={(e) =>
                      setQuizData({
                        ...quizData,
                        passing_score: parseInt(e.target.value) || 70,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Questions</h3>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Question
                  </Button>
                </div>

                {quizData.questions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                    <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">No questions yet</p>
                    <Button onClick={addQuestion} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add First Question
                    </Button>
                  </div>
                ) : (
                  quizData.questions.map((question: any, index: number) => (
                    <QuestionCard
                      key={index}
                      question={question}
                      index={index}
                      totalQuestions={quizData.questions.length}
                      onUpdate={(updates) => updateQuestion(index, updates)}
                      onDelete={() => deleteQuestion(index)}
                      onMove={(direction) => moveQuestion(index, direction)}
                      onAddOption={() => addOption(index)}
                      onUpdateOption={(optionIndex, value) =>
                        updateOption(index, optionIndex, value)
                      }
                      onDeleteOption={(optionIndex) => deleteOption(index, optionIndex)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

interface QuestionCardProps {
  question: any;
  index: number;
  totalQuestions: number;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  onAddOption: () => void;
  onUpdateOption: (optionIndex: number, value: string) => void;
  onDeleteOption: (optionIndex: number) => void;
}

function QuestionCard({
  question,
  index,
  totalQuestions,
  onUpdate,
  onDelete,
  onMove,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <Card className="p-4 bg-white border-2">
      <div className="flex gap-3">
        {/* Drag Handle & Position */}
        <div className="flex flex-col items-center gap-1">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
          <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
          <div className="flex flex-col gap-1 mt-2">
            <button
              onClick={() => onMove("up")}
              disabled={index === 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              title="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMove("down")}
              disabled={index === totalQuestions - 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              title="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 space-y-4">
          {/* Question Type */}
          <div className="flex gap-2">
            <Select
              value={question.question_type}
              onValueChange={(value) => {
                onUpdate({
                  question_type: value,
                  options:
                    value === "multiple_choice"
                      ? ["", "", "", ""]
                      : value === "true_false"
                      ? ["True", "False"]
                      : null,
                  correct_answer: "",
                });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="short_answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>

            {question.question_type === "multiple_choice" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={question.allow_multiple || false}
                  onChange={(e) =>
                    onUpdate({ allow_multiple: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-gray-700">Allow multiple answers</span>
              </label>
            )}

            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="ml-auto text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Question Text */}
          <div>
            <Label>Question</Label>
            <Textarea
              value={question.question}
              onChange={(e) => onUpdate({ question: e.target.value })}
              placeholder="Enter your question here..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Options for Multiple Choice */}
          {question.question_type === "multiple_choice" && (
            <div className="space-y-2">
              <Label>Answer Options</Label>
              {question.options?.map((option: string, optionIndex: number) => (
                <div key={optionIndex} className="flex gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type={question.allow_multiple ? "checkbox" : "radio"}
                      name={`correct-${index}`}
                      checked={
                        question.allow_multiple
                          ? question.correct_answer?.split(",").includes(option)
                          : question.correct_answer === option
                      }
                      onChange={() => {
                        if (question.allow_multiple) {
                          const currentAnswers = question.correct_answer
                            ? question.correct_answer.split(",")
                            : [];
                          const newAnswers = currentAnswers.includes(option)
                            ? currentAnswers.filter((a: string) => a !== option)
                            : [...currentAnswers, option];
                          onUpdate({ correct_answer: newAnswers.join(",") });
                        } else {
                          onUpdate({ correct_answer: option });
                        }
                      }}
                      className="w-4 h-4 text-green-600"
                    />
                    <Input
                      value={option}
                      onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      className="flex-1"
                    />
                  </div>
                  {question.options.length > 2 && (
                    <Button
                      onClick={() => onDeleteOption(optionIndex)}
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button onClick={onAddOption} variant="outline" size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
              <p className="text-xs text-gray-500">
                {question.allow_multiple
                  ? "Check all correct answers"
                  : "Select the correct answer"}
              </p>
            </div>
          )}

          {/* Options for True/False */}
          {question.question_type === "true_false" && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={question.correct_answer === "True"}
                    onChange={() => onUpdate({ correct_answer: "True" })}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="font-medium text-green-600">True</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={question.correct_answer === "False"}
                    onChange={() => onUpdate({ correct_answer: "False" })}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="font-medium text-red-600">False</span>
                </label>
              </div>
            </div>
          )}

          {/* Correct Answer for Short Answer */}
          {question.question_type === "short_answer" && (
            <div>
              <Label>Expected Answer (for grading reference)</Label>
              <Input
                value={question.correct_answer}
                onChange={(e) => onUpdate({ correct_answer: e.target.value })}
                placeholder="e.g., JavaScript"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Student answers will be manually reviewed
              </p>
            </div>
          )}

          {/* Explanation */}
          <div>
            <Button
              onClick={() => setShowExplanation(!showExplanation)}
              variant="outline"
              size="sm"
              type="button"
            >
              {showExplanation ? "Hide" : "Add"} Explanation
            </Button>
            {showExplanation && (
              <Textarea
                value={question.explanation || ""}
                onChange={(e) => onUpdate({ explanation: e.target.value })}
                placeholder="Optional: Explain why this is the correct answer..."
                className="mt-2"
                rows={2}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}