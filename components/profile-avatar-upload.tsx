"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ImageIcon, Link2, X, Loader2, CheckCircle } from "lucide-react";

interface ProfileAvatarUploadProps {
  userId: string;
  currentUrl: string;
  fullName: string;
  onUrlChange: (url: string) => void;
}

function convertDriveUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  return url;
}

export default function ProfileAvatarUpload({
  userId,
  currentUrl,
  fullName,
  onUrlChange,
}: ProfileAvatarUploadProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [urlWarning, setUrlWarning] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadStatus("error");
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus("error");
      return;
    }

    setUploading(true);
    setUploadStatus("idle");

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      onUrlChange(publicUrl);
      setUploadStatus("success");

      // Reset success status after 3s
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  }, [userId, supabase, onUrlChange]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Check for files first
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
      return;
    }

    // Check for image URL (dragged from browser)
    const html = e.dataTransfer.getData("text/html");
    const urlText = e.dataTransfer.getData("text/plain");

    if (html) {
      const match = html.match(/src="([^"]+)"/);
      if (match?.[1]) {
        const imgUrl = convertDriveUrl(match[1]);
        onUrlChange(imgUrl);
        setUploadStatus("success");
        setTimeout(() => setUploadStatus("idle"), 3000);
        return;
      }
    }

    if (urlText && (urlText.startsWith("http://") || urlText.startsWith("https://"))) {
      const converted = convertDriveUrl(urlText);
      onUrlChange(converted);
      setUploadStatus("success");
      setTimeout(() => setUploadStatus("idle"), 3000);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    setUrlWarning(null);

    // OneDrive warning
    if (urlInput.includes("1drv.ms") || urlInput.includes("onedrive.live.com")) {
      setUrlWarning("Los enlaces de OneDrive no funcionan directamente. Descarga la imagen y súbela aquí.");
      return;
    }

    // Google Drive auto-convert
    if (urlInput.includes("drive.google.com")) {
      const converted = convertDriveUrl(urlInput);
      onUrlChange(converted);
      setUrlWarning("Enlace de Google Drive convertido. Asegúrate de que sea público.");
      setUploadStatus("success");
      setTimeout(() => setUploadStatus("idle"), 3000);
      return;
    }

    onUrlChange(urlInput.trim());
    setUploadStatus("success");
    setTimeout(() => setUploadStatus("idle"), 3000);
  };

  const handleRemoveAvatar = () => {
    onUrlChange("");
    setUrlInput("");
    setUrlWarning(null);
    setUploadStatus("idle");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-5">
        {/* Avatar Preview */}
        <div className="relative flex-shrink-0 group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-3 border-gray-200 shadow-sm">
            {currentUrl ? (
              <img
                src={currentUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                {fullName?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}

          {/* Remove button */}
          {currentUrl && !uploading && (
            <button
              onClick={handleRemoveAvatar}
              className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors opacity-0 group-hover:opacity-100"
              title="Quitar foto"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upload Area */}
        <div className="flex-1 space-y-3">
          {/* Mode tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === "upload"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Upload className="w-3 h-3" />
              Subir imagen
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === "url"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Link2 className="w-3 h-3" />
              Pegar URL
            </button>
          </div>

          {/* Upload mode */}
          {mode === "upload" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-purple-500 bg-purple-50 scale-[1.02]"
                  : uploadStatus === "success"
                  ? "border-green-400 bg-green-50"
                  : uploadStatus === "error"
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-2 py-1">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  <p className="text-sm text-purple-700 font-medium">Subiendo imagen...</p>
                </div>
              ) : uploadStatus === "success" ? (
                <div className="flex flex-col items-center gap-2 py-1">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">¡Imagen actualizada!</p>
                </div>
              ) : uploadStatus === "error" ? (
                <div className="flex flex-col items-center gap-2 py-1">
                  <X className="w-6 h-6 text-red-500" />
                  <p className="text-sm text-red-600 font-medium">Error al subir. Máximo 5MB, formato imagen.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-1">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Arrastra una imagen aquí o <span className="text-purple-600">haz clic para buscar</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG o WebP • Máximo 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL mode */}
          {mode === "url" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setUrlWarning(null);
                  }}
                  placeholder="https://drive.google.com/file/d/... o URL directa"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUrlSubmit();
                    }
                  }}
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>

              {urlWarning && (
                <p className="text-xs text-amber-600 flex items-start gap-1">
                  <span>⚠</span>
                  <span>{urlWarning}</span>
                </p>
              )}

              <p className="text-xs text-gray-400">
                Soporta Google Drive (se convierte automáticamente), Imgur, Cloudinary, o cualquier URL directa de imagen.
                {" "}Tu foto de Google se usa si no ingresas ninguna.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
