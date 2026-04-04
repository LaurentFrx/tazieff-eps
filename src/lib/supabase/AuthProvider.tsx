"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClientAsync } from "./client";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAnonymous: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAnonymous: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    const supabase = await getSupabaseBrowserClientAsync();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        const { data } = await supabase.auth.signInAnonymously();
        setUser(data.user ?? null);
      }
    } catch {
      // Auth failed — app continues without auth
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    let cancelled = false;
    let cleanupRef: (() => void) | null = null;

    getSupabaseBrowserClientAsync().then((supabase) => {
      if (cancelled || !supabase) return;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
        },
      );

      cleanupRef = () => subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      cleanupRef?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAnonymous: user?.is_anonymous ?? false,
    }),
    [user, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
