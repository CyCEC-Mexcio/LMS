"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/student";

  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push(redirect);
        router.refresh();
      }
    });
  }, [router, redirect]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Iniciando sesión...</p>
      </div>
    </div>
  );
}