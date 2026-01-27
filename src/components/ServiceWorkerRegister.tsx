"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.serwist?.register();
  }, []);

  return null;
}
