"use client";

import { useContext } from "react";
import { AuthContext } from "@/lib/supabase/AuthProvider";

export function useAuth() {
  return useContext(AuthContext);
}
