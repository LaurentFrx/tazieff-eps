"use client";

import Image from "next/image";
import { useState } from "react";

type ExoThumbProps = {
  slug: string;
  size?: number;
  className?: string;
};

function DumbbellIcon({ size }: { size: number }) {
  const s = Math.round(size * 0.55);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
      <path d="M6.5 6.5L17.5 17.5" /><path d="M3.5 10L10 3.5" /><path d="M14 20.5L20.5 14" /><path d="M2 11.5l1.5-1.5" /><path d="M20.5 13L22 11.5" />
    </svg>
  );
}

export function ExoThumb({ slug, size = 60, className = "" }: ExoThumbProps) {
  const [err, setErr] = useState(false);

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg bg-white/10 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {err ? (
        <DumbbellIcon size={size} />
      ) : (
        <Image
          src={`/images/exos/thumb-${slug}.webp`}
          alt=""
          width={size}
          height={size}
          className="object-cover"
          style={{ width: size, height: size }}
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
}
