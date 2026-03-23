"use client";

import { usePlan } from "@/hooks/usePlan";
import { ProTeaser } from "./ProTeaser";

type ProGateProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string;
};

export function ProGate({ children, fallback, feature }: ProGateProps) {
  const { isPro, isLoading } = usePlan();

  if (isLoading) return null;
  if (isPro) return <>{children}</>;
  return <>{fallback ?? <ProTeaser feature={feature} />}</>;
}
