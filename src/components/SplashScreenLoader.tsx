"use client";

import dynamic from "next/dynamic";

const SplashScreen = dynamic(
  () => import("@/components/SplashScreen").then((m) => m.SplashScreen),
  { ssr: false },
);

export function SplashScreenLoader() {
  return <SplashScreen />;
}
