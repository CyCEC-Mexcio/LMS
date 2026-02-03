"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { 
  Paperclip, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Upload,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  Download
} from "lucide-react";

interface ResourcesSectionProps {
  lessonData: any;
  setLessonData: (data: any) => void;
  expanded: boolean;
  onToggle: () => void;
}

interface Resource {
  id: string;
  type: "file" | "link";
  title: string;
  url: string;
  size?: number;
  filename?: string;
}

export default function ResourcesSection({
  lessonData,
  setLessonData,
  expanded,
  onToggle,
}: ResourcesSectionProps) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "" });

  const resources: Resource[] = lessonData.resources || [];

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lesson-resources/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("course-files")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("course-files")
        .getPublicUrl(filePath);

      const newResource: Resource = {
        id: Math.random().toString(36).substring(2),
        type: "file",
        title: file.name,
        url: urlData.publicUrl,
        size: file.size,
        filename: file.name,
      };

      const updatedResources = [...resources, newResource];
      setLessonData({ ...lessonData, resources: updatedResources });

      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      alert("Please enter both title and URL");
      return;
    }

    // Validate URL
    try {
      new URL(newLink.url);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    const newResource: Resource = {
      id: Math.random().toString(36).substring(2),
      type: "link",
      title: newLink.title,
      url: newLink.url,
    };

    const updatedResources = [...resources, newResource];
    setLessonData({ ...lessonData, resources: updatedResources });

    setNewLink({ title: "", url: "" });
    setShowAddLink(false);
  };

  const handleDeleteResource = async (resource: Resource) => {
    const confirmed = confirm(`Delete "${resource.title}"?`);
    if (!confirmed) return;

    try {
      // If it's a file, delete from storage
      if (resource.type === "file" && resource.url) {
        const urlParts = resource.url.split("/");
        const filePath = urlParts.slice(urlParts.indexOf("lesson-resources")).join("/");
        
        await supabase.storage.from("course-files").remove([filePath]);
      }

      const updatedResources = resources.filter((r) => r.id !== resource.id);
      setLessonData({ ...lessonData, resources: updatedResources });
    } catch (error) {
      console.error("Error deleting resource:", error);
      alert("Error deleting resource");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Resources</h2>
              <p className="text-sm text-gray-600">
                {resources.length > 0
                  ? `${resources.length} resource${resources.length > 1 ? "s" : ""}`
                  : "Add downloadable files and links"}
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
            <div className="flex gap-3">
              <input
                type="file"
                id="resource-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              />
              <label htmlFor="resource-upload" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  disabled={uploading}
                  onClick={() => document.getElementById("resource-upload")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
              </label>
              <Button
                onClick={() => setShowAddLink(!showAddLink)}
                variant="outline"
                className="flex-1"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Supported: PDF, DOC, XLS, PPT, TXT, ZIP (max 50MB)
            </p>

            {/* Add Link Form */}
            {showAddLink && (
              <Card className="p-4 mt-4 bg-gray-50">
                <h4 className="font-medium mb-3">Add External Link</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="link-title">Link Title</Label>
                    <Input
                      id="link-title"
                      value={newLink.title}
                      onChange={(e) =>
                        setNewLink({ ...newLink, title: e.target.value })
                      }
                      placeholder="e.g., Course Documentation"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="link-url">URL</Label>
                    <Input
                      id="link-url"
                      value={newLink.url}
                      onChange={(e) =>
                        setNewLink({ ...newLink, url: e.target.value })
                      }
                      placeholder="https://example.com"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddLink} size="sm" className="flex-1">
                      Add Link
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddLink(false);
                        setNewLink({ title: "", url: "" });
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Resources List */}
          {resources.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Added Resources</h4>
              {resources.map((resource) => (
                <Card key={resource.id} className="p-4 bg-white">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        resource.type === "file"
                          ? "bg-blue-100"
                          : "bg-purple-100"
                      }`}
                    >
                      {resource.type === "file" ? (
                        <FileText
                          className={`w-5 h-5 ${
                            resource.type === "file"
                              ? "text-blue-600"
                              : "text-purple-600"
                          }`}
                        />
                      ) : (
                        <ExternalLink className="w-5 h-5 text-purple-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">
                        {resource.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        {resource.type === "file" && resource.size && (
                          <span className="text-xs text-gray-500">
                            {formatFileSize(resource.size)}
                          </span>
                        )}
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {resource.type === "file" ? (
                            <>
                              <Download className="w-3 h-3" />
                              Download
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3 h-3" />
                              Open Link
                            </>
                          )}
                        </a>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleDeleteResource(resource)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {resources.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
              <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No resources added yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Upload files or add links to help students learn
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}