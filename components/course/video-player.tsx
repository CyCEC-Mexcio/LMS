// components/course/video-player.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlayCircle, CheckCircle } from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  video_url: string | null;
  video_provider: string | null;
  mux_playback_id: string | null;
  youtube_url: string | null;
  embed_code: string | null;
  duration_minutes: number | null;
  content: string | null;
};

export default function VideoPlayer({
  lesson,
  onComplete,
  isCompleted,
}: {
  lesson: Lesson;
  onComplete: () => void;
  isCompleted: boolean;
}) {
  const [hasWatched, setHasWatched] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const hasSetupTimer = useRef(false);

  // Memoize these to prevent recalculation
  const hasVideo = useMemo(() => {
    return !!(lesson.video_provider || lesson.video_url);
  }, [lesson.video_provider, lesson.video_url]);

  // Only auto-track progress for Mux videos (can't track real progress)
  const needsAutoTracking = useMemo(() => {
    return lesson.video_provider === "mux";
  }, [lesson.video_provider]);

  // Auto-mark as watched based on video type
  useEffect(() => {
    console.log('🔍 Video Player Debug:', {
      lessonId: lesson.id,
      hasVideo,
      videoProvider: lesson.video_provider,
      needsAutoTracking,
      embedCode: !!lesson.embed_code,
      youtubeUrl: !!lesson.youtube_url,
      muxPlaybackId: !!lesson.mux_playback_id,
    });
    
    // No video at all
    if (!hasVideo) {
      console.log('✅ No video - marking as watched');
      setHasWatched(true);
      return;
    }
    
    // YouTube, embed, or direct videos - trust users to watch
    // Only Mux videos require the auto-timer
    if (!needsAutoTracking) {
      console.log('✅ Non-Mux video - marking as watched immediately');
      setHasWatched(true);
    } else {
      console.log('⏱️ Mux video - will use auto-timer');
    }
  }, [hasVideo, needsAutoTracking, lesson.id]);

  // Setup timer ONLY for Mux videos - ONLY RUN ONCE PER LESSON
  useEffect(() => {
    // Skip if not Mux video, already completed, already watched, or timer already set up
    if (!needsAutoTracking || isCompleted || hasWatched || hasSetupTimer.current) {
      return;
    }

    // Mark that we've setup the timer for this lesson
    hasSetupTimer.current = true;

    // Clear any existing timer (safety)
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Set start time
    startTimeRef.current = Date.now();

    // Calculate estimated watch time based on duration
    const estimatedDuration = lesson.duration_minutes 
      ? lesson.duration_minutes * 60 * 1000 
      : 180000; // 3 minutes in milliseconds

    // Mark as watched after 80% of estimated duration
    const watchThreshold = estimatedDuration * 0.8;

    console.log(`Starting timer for lesson ${lesson.id}: ${estimatedDuration}ms total, ${watchThreshold}ms threshold`);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / estimatedDuration) * 100, 100);
      
      setWatchProgress(progress);

      // Auto-complete when threshold is reached
      if (elapsed >= watchThreshold) {
        console.log('Video watch threshold reached!');
        setHasWatched(true);
        setWatchProgress(100);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, 1000);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [lesson.id, needsAutoTracking, isCompleted, hasWatched]); // Added proper dependencies

  // Reset timer setup flag when lesson changes
  useEffect(() => {
    hasSetupTimer.current = false;
    setWatchProgress(0);
    // Don't reset hasWatched here - it's handled in the main effect above
  }, [lesson.id]);

  const handleVideoEnd = () => {
    setHasWatched(true);
    setWatchProgress(100);
  };

  const handleVideoProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      setWatchProgress(progress);
      
      // Mark as watched when 90% complete
      if (progress >= 90) {
        setHasWatched(true);
      }
    }
  };

  // Memoize video rendering to prevent re-renders
  const videoElement = useMemo(() => {
    // Embed Code (includes YouTube embeds pasted as HTML)
    if (lesson.video_provider === "embed" && lesson.embed_code) {
      return (
        <div 
          key={lesson.id} 
          className="w-full aspect-video bg-black rounded-lg overflow-hidden"
        >
          <div
            dangerouslySetInnerHTML={{ __html: lesson.embed_code }}
            className="w-full h-full"
          />
        </div>
      );
    }

    // YouTube Video (from URL)
    if (lesson.video_provider === "youtube" && lesson.youtube_url) {
      const videoId = extractYouTubeId(lesson.youtube_url);
      if (videoId) {
        return (
          <div 
            key={lesson.id}
            className="w-full aspect-video bg-black rounded-lg overflow-hidden"
          >
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

    // Mux Video
    if (lesson.video_provider === "mux" && lesson.mux_playback_id) {
      return (
        <div 
          key={lesson.id}
          className="w-full aspect-video bg-black rounded-lg overflow-hidden"
        >
          <iframe
            src={`https://stream.mux.com/${lesson.mux_playback_id}.m3u8`}
            className="w-full h-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Direct Video URL
    if (lesson.video_url) {
      return (
        <video
          key={lesson.id}
          ref={videoRef}
          src={lesson.video_url}
          controls
          className="w-full rounded-lg bg-black"
          onEnded={handleVideoEnd}
          onTimeUpdate={handleVideoProgress}
        >
          Tu navegador no soporta el elemento de video.
        </video>
      );
    }

    // No video available
    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-16 text-center">
        <PlayCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Esta lección no tiene video</p>
        <p className="text-gray-500 text-sm mt-2">
          Revisa el contenido escrito y recursos a continuación
        </p>
      </div>
    );
  }, [lesson.id, lesson.video_provider, lesson.embed_code, lesson.youtube_url, lesson.mux_playback_id, lesson.video_url]);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {videoElement}
        
        {!isCompleted && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {hasVideo && !hasWatched ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Ve el video para continuar
                    </p>
                    {watchProgress > 0 && watchProgress < 100 && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${watchProgress}%` }}
                          />
                        </div>
                        {needsAutoTracking && (
                          <p className="text-xs text-gray-500">
                            Progreso estimado: {Math.round(watchProgress)}%
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ) : hasWatched ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">
                      {hasVideo ? "Video completado" : "Listo para completar"}
                    </p>
                  </div>
                ) : null}
              </div>
              
              <Button
                onClick={onComplete}
                disabled={hasVideo && !hasWatched}
                className="ml-4"
              >
                Marcar como completada
              </Button>
            </div>
          </div>
        )}
        
        {isCompleted && (
          <div className="p-4 bg-green-50 border-t border-green-200">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Lección completada</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
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
}