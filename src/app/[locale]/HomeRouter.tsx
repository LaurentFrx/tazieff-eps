"use client";

import { useState, useEffect } from "react";
import { getNavMode, type NavMode } from "@/lib/modeStore";
import { ModeChooser } from "@/components/ModeChooser";
import { HomepageClient } from "@/components/HomepageClient";
import { MonProgrammeClient } from "@/components/MonProgrammeClient";
import { notifyModeChange } from "@/components/BottomTabBar";
import type { LiveExerciseListItem } from "@/lib/live/types";

type Props = {
  exercises: LiveExerciseListItem[];
  exerciseCount: number;
  methodeCount: number;
  learnCount: number;
};

export function HomeRouter({ exercises, exerciseCount, methodeCount, learnCount }: Props) {
  const [mode, setMode] = useState<NavMode | null | "loading">("loading");

  useEffect(() => {
    setMode(getNavMode());
  }, []);

  if (mode === "loading") return null;

  if (mode === null) {
    return (
      <ModeChooser
        onChoose={(m) => {
          setMode(m);
          notifyModeChange();
        }}
      />
    );
  }

  if (mode === "guide") {
    return <MonProgrammeClient exercises={exercises} />;
  }

  return (
    <HomepageClient
      exerciseCount={exerciseCount}
      methodeCount={methodeCount}
      learnCount={learnCount}
    />
  );
}
