"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Award, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  courseTitle: string;
  certificateType: "certificate" | "constancia";
  onClose: () => void;
};

const COLORS = ["#e53e3e", "#c53030", "#f6ad55", "#fbd38d", "#fff", "#feb2b2", "#fc8181"];
const TOTAL_PIECES = 80;

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export default function CelebrationModal({ courseTitle, certificateType, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const router = useRouter();

  // ── Confetti animation ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    type Piece = {
      x: number; y: number;
      w: number; h: number;
      color: string;
      angle: number;
      speed: number;
      spin: number;
      drift: number;
      opacity: number;
    };

    const pieces: Piece[] = Array.from({ length: TOTAL_PIECES }, () => ({
      x: randomBetween(0, canvas.width),
      y: randomBetween(-canvas.height * 0.5, 0),
      w: randomBetween(8, 16),
      h: randomBetween(4, 9),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: randomBetween(0, Math.PI * 2),
      speed: randomBetween(2.5, 6),
      spin: randomBetween(-0.12, 0.12),
      drift: randomBetween(-1.2, 1.2),
      opacity: randomBetween(0.7, 1),
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;
        if (p.y > canvas.height + 20) {
          p.y = randomBetween(-40, -10);
          p.x = randomBetween(0, canvas.width);
        }
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isCertificate = certificateType !== "constancia";
  const docLabel = isCertificate ? "Certificado" : "Constancia";
  const emoji = isCertificate ? "🎓" : "📜";

  const handleViewCertificate = () => {
    onClose();
    router.push("/student/certificates");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Confetti canvas — full screen behind modal */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Modal card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-[celebrationPop_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both]">

        {/* Red top bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-600 to-red-400" />

        <div className="p-8 text-center">

          {/* Big emoji */}
          <div className="text-7xl mb-4 animate-[celebrationBounce_0.6s_0.2s_cubic-bezier(0.34,1.56,0.64,1)_both]">
            {emoji}
          </div>

          {/* Headline */}
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            ¡Felicidades!
          </h2>
          <p className="text-gray-500 text-sm mb-1">Has completado exitosamente</p>
          <p className="font-bold text-gray-800 text-base mb-4 line-clamp-2">{courseTitle}</p>

          {/* Certificate badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-full px-4 py-2 text-sm font-semibold mb-6">
            <Award size={16} className="text-yellow-600" />
            Tu {docLabel} está listo
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleViewCertificate}
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 py-5 text-base font-bold"
            >
              <ExternalLink size={18} />
              Ver mi {docLabel}
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full text-gray-500 hover:text-gray-700">
              Cerrar
            </Button>
          </div>
        </div>

      </div>

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes celebrationPop {
          from { opacity: 0; transform: scale(0.7) translateY(40px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes celebrationBounce {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}