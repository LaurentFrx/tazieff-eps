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
      // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
      console.log("[DEBUG_P0_7_SEXIES] AuthProvider.initAuth: supabase=null", {
        host: typeof window !== "undefined" ? window.location.host : null,
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
      console.log("[DEBUG_P0_7_SEXIES] AuthProvider.initAuth: getSession result", {
        host: typeof window !== "undefined" ? window.location.host : null,
        hasSession: !!session,
        userId: session?.user?.id ?? null,
        userEmail: session?.user?.email ?? null,
        isAnon: session?.user?.is_anonymous ?? null,
        cookiePresent:
          typeof document !== "undefined" &&
          /sb-[a-z]+-auth-token/.test(document.cookie),
      });
      if (session?.user) {
        setUser(session.user);
      } else {
        // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
        console.warn(
          "[DEBUG_P0_7_SEXIES] AuthProvider.initAuth: PAS DE SESSION → signInAnonymously",
          {
            host: typeof window !== "undefined" ? window.location.host : null,
            cookieRaw:
              typeof document !== "undefined" ? document.cookie : null,
          },
        );
        const { data } = await supabase.auth.signInAnonymously();
        // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
        console.log(
          "[DEBUG_P0_7_SEXIES] AuthProvider.initAuth: signInAnonymously OK",
          { newUserId: data.user?.id ?? null },
        );
        setUser(data.user ?? null);
      }
    } catch (err) {
      // eslint-disable-next-line no-console -- DEBUG_P0_7_SEXIES
      console.error("[DEBUG_P0_7_SEXIES] AuthProvider.initAuth: catch", err);
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
