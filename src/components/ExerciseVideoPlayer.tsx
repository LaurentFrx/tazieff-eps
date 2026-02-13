"use client";

import { useState } from "react";

type ExerciseVideoPlayerProps = {
  src: string;
  poster?: string;
  className?: string;
};

export function ExerciseVideoPlayer({
  src,
  poster,
  className,
}: ExerciseVideoPlayerProps) {
  const [showControls, setShowControls] = useState(false);

  return (
    <video
      src={src}
      poster={poster}
      autoPlay
      loop
      muted
      controls={showControls}
      preload="metadata"
      playsInline
      className={className}
      onClick={() => setShowControls(true)}
      onTouchStart={() => setShowControls(true)}
    >
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  );
}
