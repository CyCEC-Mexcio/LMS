"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ChevronDown, ChevronUp, Bold, Italic, List, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentSectionProps {
  lessonData: any;
  setLessonData: (data: any) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function ContentSection({
  lessonData,
  setLessonData,
  expanded,
  onToggle,
}: ContentSectionProps) {
  const insertFormatting = (before: string, after: string = "") => {
    const textarea = document.getElementById("lesson-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = lessonData.content?.substring(start, end) || "";
    const beforeText = lessonData.content?.substring(0, start) || "";
    const afterText = lessonData.content?.substring(end) || "";

    const newContent = beforeText + before + selectedText + after + afterText;
    setLessonData({ ...lessonData, content: newContent });

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length + selectedText.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Lesson Content</h2>
              <p className="text-sm text-gray-600">
                {lessonData.content
                  ? `${lessonData.content.length} characters`
                  : "Add detailed lesson content"}
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
        <div className="px-6 pb-6 space-y-4 border-t">
          <div className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="lesson-content">Content</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting("**", "**")}
                  title="Bold"
                >
                  <Bold className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting("*", "*")}
                  title="Italic"
                >
                  <Italic className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting("\n- ")}
                  title="Bullet List"
                >
                  <List className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting("[link text](", ")")}
                  title="Link"
                >
                  <LinkIcon className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <Textarea
              id="lesson-content"
              value={lessonData.content || ""}
              onChange={(e) =>
                setLessonData({ ...lessonData, content: e.target.value })
              }
              placeholder="Write detailed lesson content here...

You can use markdown formatting:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- [Links](https://example.com) to external resources
- Lists with - or 1. 

This content will be displayed alongside the video to help students learn."
              className="min-h-[400px] font-mono text-sm"
            />
            
            <p className="text-xs text-gray-500 mt-2">
              Markdown formatting supported. This content appears below the video player.
            </p>
          </div>

          {lessonData.content && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <div className="prose prose-sm max-w-none">
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: lessonData.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>")
                      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
                      .replace(/\n- /g, "\n• ")
                      .replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}