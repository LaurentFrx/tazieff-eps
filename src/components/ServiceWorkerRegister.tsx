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

    // Check for SW updates periodically and when the tab regains focus
    const checkUpdate = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      });
    };

    // Check every 10 minutes
    const interval = setInterval(checkUpdate, 10 * 60 * 1000);

    // Check when the user returns to the tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkUpdate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Auto-reload once when a new SW takes control
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}
