'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useTimerContext } from '@/contexts/TimerContext';
import { LocaleLink as Link } from '@/components/LocaleLink';
import { TabataTimer } from '@/components/timer/presets/TabataTimer';
import { EmomTimer } from '@/components/timer/presets/EmomTimer';
import { CircuitTimer } from '@/components/timer/presets/CircuitTimer';
import { AmrapTimer } from '@/components/timer/presets/AmrapTimer';
import { ReposTimer } from '@/components/timer/presets/ReposTimer';
import { CustomTimer } from '@/components/timer/presets/CustomTimer';
import { useReveal } from '@/hooks/useReveal';

// ---------- Preset card definitions ----------

interface PresetCard {
  id: string;
  gradient: string;
  glow: string;
  subtitle: string;
  detail: string;
}

const PRESETS: PresetCard[] = [
  { id: 'tabata', gradient: 'linear-gradient(135deg, #16a34a, #22c55e)', glow: '0 0 20px rgba(52,211,153,0.3)', subtitle: '20s effort / 10s repos', detail: '8 rounds — 4 min' },
  { id: 'emom', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', glow: '0 0 20px rgba(59,130,246,0.3)', subtitle: '1 exo par minute', detail: 'Chaque minute, top départ' },
  { id: 'circuit', gradient: 'linear-gradient(135deg, #ea580c, #f97316)', glow: '0 0 20px rgba(249,115,22,0.3)', subtitle: 'Travail / repos par station', detail: 'Enchaînement continu' },
  { id: 'amrap', gradient: 'linear-gradient(135deg, #dc2626, #ef4444)', glow: '0 0 20px rgba(239,68,68,0.3)', subtitle: 'Max reps en temps limité', detail: 'Intensité maximale' },
  { id: 'repos', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)', glow: '0 0 20px rgba(6,182,212,0.3)', subtitle: 'Chrono entre séries', detail: '30s — 1min — 2min — 5min' },
  { id: 'custom', gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', glow: '0 0 20px rgba(139,92,246,0.3)', subtitle: 'Configure ton chrono', detail: 'Durées personnalisées' },
];

const PRESET_ICONS: Record<string, React.ReactNode> = {
  tabata: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  emom: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <path d="M5 3v18M19 3v18M5 12h14M5 7h14M5 17h14"/>
    </svg>
  ),
  circuit: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  amrap: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  repos: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <path d="M18.36 5.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
    </svg>
  ),
  custom: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <circle cx="12" cy="12" r="3"/><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    </svg>
  ),
};

// ---------- Timer component map ----------

const TIMER_COMPONENTS: Record<string, React.ComponentType<{ onBack: () => void }>> = {
  tabata: TabataTimer,
  emom: EmomTimer,
  circuit: CircuitTimer,
  amrap: AmrapTimer,
  repos: ReposTimer,
  custom: CustomTimer,
};

// ---------- Reveal wrapper for preset cards ----------

function PresetReveal({ delay, children }: { delay: number; children: React.ReactNode }) {
  const ref = useReveal(delay);
  return <div ref={ref as React.RefObject<HTMLDivElement>}>{children}</div>;
}

// ---------- Page ----------

export default function TimerPage() {
  const { t } = useI18n();
  const ctx = useTimerContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select active timer on mount (not on back navigation within page)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current && ctx?.isActive && ctx.timerType) {
      setSelectedId(ctx.timerType);
    }
    mountedRef.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Render selected timer
  if (selectedId) {
    const TimerComponent = TIMER_COMPONENTS[selectedId];
    if (TimerComponent) {
      return <TimerComponent onBack={() => setSelectedId(null)} />;
    }
  }

  // Preset selection screen
  return (
    <section className="page">
      <header className="page-header">
        <Link href="/outils" className="eyebrow hover:text-[color:var(--accent)]">
          ← {t('outils.backLabel')}
        </Link>
        <h1>{t('timer.pageTitle')}</h1>
        <p className="text-[14px] text-zinc-500 dark:text-zinc-400">{t('timer.pageSubtitle')}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {PRESETS.map((def, i) => {
          // 2-column stagger: col 0 = 0, col 1 = 80, next row +160
          const delay = Math.floor(i / 2) * 160 + (i % 2) * 80;
          return (
            <PresetReveal key={def.id} delay={delay}>
              <button
                onClick={() => setSelectedId(def.id)}
                className="tap-feedback relative overflow-hidden rounded-2xl text-left cursor-pointer flex flex-col justify-end w-full"
                style={{
                  background: def.gradient,
                  padding: '20px 16px',
                  minHeight: '120px',
                  border: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}
                onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = def.glow; }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                {PRESET_ICONS[def.id]}
                <span className="text-[18px] font-bold text-white" style={{ letterSpacing: '0.03em' }}>
                  {t(`timer.presets.${def.id}.name`)}
                </span>
                <span className="text-[12px] text-white/70 mt-1">
                  {def.subtitle}
                </span>
                <span className="text-[11px] text-white/45 mt-0.5">
                  {def.detail}
                </span>
              </button>
            </PresetReveal>
          );
        })}
      </div>
    </section>
  );
}
