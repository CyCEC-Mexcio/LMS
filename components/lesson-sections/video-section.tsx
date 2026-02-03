"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, ChevronDown, ChevronUp, Upload, Link as LinkIcon } from "lucide-react";

interface VideoSectionProps {
  lessonData: any;
  setLessonData: (data: any) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function VideoSection({
  lessonData,
  setLessonData,
  expanded,
  onToggle,
}: VideoSectionProps) {
  const [uploadingToMux, setUploadingToMux] = useState(false);

  const handleVideoProviderChange = (provider: "youtube" | "mux" | "embed" | "none") => {
    if (provider === "none") {
      setLessonData({
        ...lessonData,
        video_provider: null,
        youtube_url: null,
        mux_playback_id: null,
        embed_code: null,
      });
    } else {
      setLessonData({
        ...lessonData,
        video_provider: provider,
        youtube_url: provider === "youtube" ? lessonData.youtube_url : null,
        mux_playback_id: provider === "mux" ? lessonData.mux_playback_id : null,
        embed_code: provider === "embed" ? lessonData.embed_code : null,
      });
    }
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYouTubeEmbedUrl = () => {
    if (!lessonData.youtube_url) return null;
    const videoId = extractYouTubeId(lessonData.youtube_url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleMuxUpload = async (file: File) => {
    setUploadingToMux(true);
    try {
      // Create upload URL
      const response = await fetch("/api/mux/create-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to create upload URL");

      const { uploadUrl, uploadId } = await response.json();

      // Upload file to Mux
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload to Mux");

      // Poll for asset status
      let playbackId = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (!playbackId && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

        const statusResponse = await fetch(`/api/mux/check-upload?uploadId=${uploadId}`);
        const statusData = await statusResponse.json();

        if (statusData.playbackId) {
          playbackId = statusData.playbackId;
          break;
        }

        attempts++;
      }

      if (!playbackId) {
        throw new Error("Video processing timed out. Please try again later.");
      }

      setLessonData({
        ...lessonData,
        video_provider: "mux",
        mux_playback_id: playbackId,
      });

      alert("Video uploaded successfully!");
    } catch (error) {
      console.error("Error uploading to Mux:", error);
      alert("Error uploading video. Please try again.");
    } finally {
      setUploadingToMux(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Add Video</h2>
              <p className="text-sm text-gray-600">
                {lessonData.video_provider
                  ? `Using ${lessonData.video_provider.toUpperCase()}`
                  : "Optional - Add video content"}
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
            <Label>Video Provider</Label>
            <Select
              value={lessonData.video_provider || "none"}
              onValueChange={(value) => handleVideoProviderChange(value as any)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose video provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Video</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="mux">Mux (Professional)</SelectItem>
                <SelectItem value="embed">Custom Embed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* YouTube */}
          {lessonData.video_provider === "youtube" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="youtube_url">YouTube URL</Label>
                <div className="flex gap-2 mt-1">
                  <LinkIcon className="w-5 h-5 text-gray-400 mt-2" />
                  <Input
                    id="youtube_url"
                    value={lessonData.youtube_url || ""}
                    onChange={(e) =>
                      setLessonData({ ...lessonData, youtube_url: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Paste a YouTube video URL (watch or embed link)
                </p>
              </div>

              {lessonData.youtube_url && getYouTubeEmbedUrl() && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={getYouTubeEmbedUrl() || ""}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mux */}
          {lessonData.video_provider === "mux" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="mux_upload">Upload Video to Mux</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="mux_upload"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleMuxUpload(file);
                      }
                    }}
                    disabled={uploadingToMux}
                    className="hidden"
                  />
                  <label htmlFor="mux_upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full cursor-pointer"
                      disabled={uploadingToMux}
                      onClick={() => document.getElementById("mux_upload")?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingToMux ? "Uploading..." : "Choose Video File"}
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported: MP4, MOV, AVI (max 5GB). Processing may take a few minutes.
                  </p>
                </div>
              </div>

              {lessonData.mux_playback_id && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Video Preview:</p>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={`https://stream.mux.com/${lessonData.mux_playback_id}.m3u8`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Video ready
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Custom Embed */}
          {lessonData.video_provider === "embed" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="embed_code">Embed Code</Label>
                <Textarea
                  id="embed_code"
                  value={lessonData.embed_code || ""}
                  onChange={(e) =>
                    setLessonData({ ...lessonData, embed_code: e.target.value })
                  }
                  placeholder='<iframe src="..." width="100%" height="400"></iframe>'
                  className="mt-1 font-mono text-sm"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the complete iframe embed code from Vimeo, Wistia, or other providers
                </p>
              </div>

              {lessonData.embed_code && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div
                    className="aspect-video bg-black rounded-lg overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: lessonData.embed_code }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}