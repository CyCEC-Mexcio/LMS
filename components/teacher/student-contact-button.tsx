"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Copy, Check, ExternalLink, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface StudentContactButtonProps {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  progressPct: number;
}

export function StudentContactButton({
  studentName,
  studentEmail,
  courseTitle,
  progressPct,
}: StudentContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const subject = `Seguimiento del curso: ${courseTitle}`;
  const body = `Hola ${studentName},\n\nNoté que estás inscrito en el curso "${courseTitle}" y tu avance actual es del ${progressPct}%.\n\nQuisiera saber si tienes alguna duda o te has atorado en alguna lección para ayudarte a continuar.\n\n¡Saludos!`;

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    studentEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(
    studentEmail
  )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const mailtoUrl = `mailto:${studentEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(studentEmail);
      setCopied(true);
      toast.success("Correo copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el correo");
    }
  };

  if (!studentEmail) {
    return <span className="text-xs text-gray-400">Sin correo</span>;
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1.5 text-xs text-[#C4161C] border-red-200 hover:bg-red-50 hover:text-[#a01218] transition-colors"
      >
        <Mail size={13} />
        Enviar Correo
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-left animate-in fade-in-0 zoom-in-95">
          <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Opciones de Correo
            </p>
            <p className="text-xs text-gray-600 truncate font-medium" title={studentEmail}>
              {studentEmail}
            </p>
          </div>

          {/* Gmail Web */}
          <a
            href={gmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <span className="w-4 h-4 flex items-center justify-center font-bold text-red-600 text-xs bg-red-100 rounded">
              G
            </span>
            <span className="flex-1 font-medium">Abrir en Gmail</span>
            <ExternalLink size={11} className="text-gray-400" />
          </a>

          {/* Outlook Web */}
          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <span className="w-4 h-4 flex items-center justify-center font-bold text-blue-600 text-xs bg-blue-100 rounded">
              O
            </span>
            <span className="flex-1 font-medium">Abrir en Outlook Web</span>
            <ExternalLink size={11} className="text-gray-400" />
          </a>

          {/* Default Mail Client */}
          <a
            href={mailtoUrl}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Mail size={14} className="text-gray-500 ml-0.5" />
            <span className="flex-1 font-medium ml-0.5">App predeterminada</span>
          </a>

          <div className="border-t border-gray-100 my-1" />

          {/* Copy Email */}
          <button
            type="button"
            onClick={handleCopyEmail}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-600 ml-0.5" />
                <span className="font-medium text-green-600 ml-0.5">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-gray-500 ml-0.5" />
                <span className="font-medium ml-0.5">Copiar dirección de correo</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
