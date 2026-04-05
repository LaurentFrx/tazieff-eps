'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface WheelPickerProps {
  values: number[];
  defaultValue: number;
  unit?: string;
  color?: string;
  onChange: (value: number) => void;
  height?: number;
  itemHeight?: number;
  label?: string;
  /** Custom label renderer — overrides default `{value}{unit}` display */
  formatLabel?: (value: number) => { main: string; unit?: string };
}

export interface WheelPickerHandle {
  scrollToValue: (value: number) => void;
}

export const WheelPicker = forwardRef<WheelPickerHandle, WheelPickerProps>(function WheelPicker({
  values,
  defaultValue,
  unit = 's',
  color = '#22c55e',
  onChange,
  height = 120,
  itemHeight = 40,
  label,
  formatLabel,
}, ref) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafId = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastIdx = useRef(-1);
  const didInit = useRef(false);

  const initIdx = Math.max(0, values.indexOf(defaultValue));

  const applyVisuals = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const st = el.scrollTop;
    const idx = Math.min(Math.max(Math.round(st / itemHeight), 0), values.length - 1);

    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      onChangeRef.current(values[idx]);
    }

    for (let i = 0; i < rowRefs.current.length; i++) {
      const row = rowRefs.current[i];
      if (!row) continue;
      const d = Math.abs(st - i * itemHeight);

      let op: number, sc: number;
      if (d < itemHeight * 0.6) {
        op = 1; sc = 1;
      } else if (d < itemHeight * 1.6) {
        const p = (d - itemHeight * 0.6) / itemHeight;
        op = 1 - p * 0.7; sc = 1 - p * 0.1;
      } else {
        op = 0.1; sc = 0.8;
      }
      row.style.opacity = String(op);
      row.style.transform = `scale(${sc})`;
    }
  }, [values, itemHeight]);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(applyVisuals);
  }, [applyVisuals]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = initIdx * itemHeight;
    applyVisuals();
  }, [initIdx, itemHeight, applyVisuals]);

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  // Imperative API for programmatic scrolling
  useImperativeHandle(ref, () => ({
    scrollToValue(value: number) {
      const idx = values.indexOf(value);
      if (idx === -1 || !scrollRef.current) return;
      scrollRef.current.scrollTo({ top: idx * itemHeight, behavior: 'smooth' });
    },
  }), [values, itemHeight]);

  const visibleItems = Math.floor(height / itemHeight);
  const padItems = Math.floor(visibleItems / 2);
  const padH = padItems * itemHeight;

  const mask = 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)';

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  };
  const rgb = hexToRgb(color);

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span
          className="text-[11px] font-semibold tracking-wider uppercase mb-1"
          style={{ color, textShadow: `0 0 10px rgba(${rgb},0.3)` }}
        >
          {label}
        </span>
      )}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          height,
          width: '100%',
        }}
      >
        <style>{`
          .wp-container-${cssId(color)} {
            background: rgba(0,0,0,0.08);
            border: 1px solid rgba(${rgb},0.15);
          }
          :where(.dark, .dark *) .wp-container-${cssId(color)} {
            background: rgba(0,0,0,0.25);
            border: 1px solid rgba(${rgb},0.2);
          }
          .wp-select-${cssId(color)} {
            background: rgba(${rgb},0.08);
            border-top: 1.5px solid rgba(${rgb},0.25);
            border-bottom: 1.5px solid rgba(${rgb},0.25);
          }
          :where(.dark, .dark *) .wp-select-${cssId(color)} {
            background: rgba(${rgb},0.1);
            border-top: 1.5px solid rgba(${rgb},0.35);
            border-bottom: 1.5px solid rgba(${rgb},0.35);
          }
        `}</style>

        <div
          className={`relative overflow-hidden rounded-xl w-full h-full wp-container-${cssId(color)}`}
        >
          {/* Selection zone */}
          <div
            className={`absolute left-0 right-0 z-[2] pointer-events-none wp-select-${cssId(color)}`}
            style={{ top: padH, height: itemHeight }}
          />

          {/* Scrollable area */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="h-full overflow-y-scroll outline-none"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          >
            <div style={{ height: padH }} aria-hidden="true" />
            {values.map((v, i) => (
              <div
                key={v}
                ref={(el) => { rowRefs.current[i] = el; }}
                className="flex items-center justify-center"
                style={{
                  height: itemHeight,
                  scrollSnapAlign: 'center',
                  transition: 'opacity .15s ease, transform .15s ease',
                  willChange: 'opacity, transform',
                }}
              >
                {formatLabel ? (() => {
                  const lbl = formatLabel(v);
                  return (
                    <>
                      <span className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white">
                        {lbl.main}
                      </span>
                      {lbl.unit && (
                        <span className="text-[11px] ml-1 text-zinc-400 dark:text-white/40">
                          {lbl.unit}
                        </span>
                      )}
                    </>
                  );
                })() : (
                  <>
                    <span className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white">
                      {v}
                    </span>
                    {unit && (
                      <span className="text-[11px] ml-1 text-zinc-400 dark:text-white/40">
                        {unit}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
            <div style={{ height: padH }} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
});

/** CSS-safe class suffix from hex color */
function cssId(hex: string) {
  return hex.replace('#', '');
}
