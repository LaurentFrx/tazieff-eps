'use client';

import { useRef, useEffect } from 'react';

interface CountdownWheelsProps {
  minutes: number;
  seconds: number;
}

const WHEEL_H = 150;
const ITEM_H = 50;
const VALUES = Array.from({ length: 60 }, (_, i) => i);

function SingleWheel({ value, label }: { value: number; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const offset = value * ITEM_H;
    containerRef.current.style.transform = `translateY(${-offset}px)`;
  }, [value]);

  // Calculate visible range for performance
  const pad = 3;
  const minV = Math.max(0, value - pad);
  const maxV = Math.min(59, value + pad);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ height: WHEEL_H, width: 90 }}
      >
        <style>{`
          .cw-wheel {
            background: rgba(0,0,0,0.05);
            border: 1px solid rgba(0,0,0,0.08);
          }
          :where(.dark, .dark *) .cw-wheel {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
          }
          .cw-select {
            background: rgba(0,0,0,0.04);
            border-top: 1px solid rgba(0,0,0,0.08);
            border-bottom: 1px solid rgba(0,0,0,0.08);
          }
          :where(.dark, .dark *) .cw-select {
            background: rgba(255,255,255,0.06);
            border-top: 1px solid rgba(255,255,255,0.2);
            border-bottom: 1px solid rgba(255,255,255,0.2);
          }
        `}</style>

        <div className="relative overflow-hidden rounded-xl w-full h-full cw-wheel">
          {/* Selection zone — center */}
          <div
            className="absolute left-0 right-0 z-[2] pointer-events-none cw-select"
            style={{ top: (WHEEL_H - ITEM_H) / 2, height: ITEM_H }}
          />

          {/* Mask fade */}
          <div
            className="absolute inset-0 z-[3] pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
              background: 'transparent',
            }}
          />

          {/* Scrolling container — driven by transform */}
          <div
            className="absolute left-0 right-0"
            style={{ top: (WHEEL_H - ITEM_H) / 2 }}
          >
            <div
              ref={containerRef}
              style={{
                transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                willChange: 'transform',
              }}
            >
              {VALUES.map((v) => {
                const dist = Math.abs(v - value);
                const visible = v >= minV && v <= maxV;

                let op: number, sc: number;
                if (dist === 0) { op = 1; sc = 1; }
                else if (dist === 1) { op = 0.25; sc = 0.75; }
                else { op = 0.08; sc = 0.6; }

                return (
                  <div
                    key={v}
                    className="flex items-center justify-center"
                    style={{
                      height: ITEM_H,
                      opacity: visible ? op : 0,
                      transform: `scale(${visible ? sc : 0.6})`,
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                    }}
                  >
                    <span className="font-mono text-[48px] font-bold text-zinc-900 dark:text-white">
                      {String(v).padStart(2, '0')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <span className="text-[11px] mt-1.5 text-zinc-400 dark:text-white/30">{label}</span>
    </div>
  );
}

export function CountdownWheels({ minutes, seconds }: CountdownWheelsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <SingleWheel value={minutes} label="min" />
      <span className="font-mono text-[36px] font-bold text-zinc-400 dark:text-white/30 -mt-6">:</span>
      <SingleWheel value={seconds} label="sec" />
    </div>
  );
}
