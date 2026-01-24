import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient(cookies());  // Add 'await' here
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getUserProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient(cookies());  // Add 'await' here
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
});

export const hasRole = async (allowedRoles: string[]) => {
  const profile = await getUserProfile();
  if (!profile) return false;
  return allowedRoles.includes(profile.role);
};