'use client';

import { useTimerContext } from '@/contexts/TimerContext';
import type { VoiceName } from '@/lib/audio/voice-coach';
import { useI18n } from '@/lib/i18n/I18nProvider';

const VOICE_OPTIONS: { value: VoiceName; labelFR: string; labelEN: string; labelES: string; icon: string }[] = [
  { value: 'Paul', labelFR: 'Paul', labelEN: 'Paul', labelES: 'Paul', icon: '\uD83C\uDFA4' },
  { value: 'Koraly', labelFR: 'Koraly', labelEN: 'Koraly', labelES: 'Koraly', icon: '\uD83C\uDFA4' },
];

export function VoiceSelector() {
  const ctx = useTimerContext();
  const { lang } = useI18n();
  if (!ctx) return null;

  const { selectedVoice, setSelectedVoice, voiceOn, toggleVoice } = ctx;

  const getLabel = (opt: (typeof VOICE_OPTIONS)[0]) => {
    if (lang === 'en') return opt.labelEN;
    if (lang === 'es') return opt.labelES;
    return opt.labelFR;
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      {/* Toggle voix on/off */}
      <button
        onClick={toggleVoice}
        className="flex items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer shrink-0"
        style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
      >
        {voiceOn ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2.5"/></svg>
        )}
      </button>

      {/* Voice selector pills */}
      {voiceOn && (
        <div className="flex gap-1.5">
          {VOICE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedVoice(opt.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer transition-all"
              style={{
                background: selectedVoice === opt.value ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.08)',
                color: selectedVoice === opt.value ? '#00E5FF' : 'rgba(255,255,255,0.6)',
                border: selectedVoice === opt.value ? '1px solid rgba(0,229,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {opt.icon} {getLabel(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
