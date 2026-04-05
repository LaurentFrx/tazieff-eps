'use client';

import { LocaleLink } from "@/components/LocaleLink";

interface DosageData {
  sets: string | null;
  reps: string | null;
  rest: string | null;
  note: string | null;
}

function parseDosage(content: string): DosageData | null {
  const lines = content.split('\n');
  let inDosage = false;
  let dosageText = '';

  for (const line of lines) {
    if (/^##\s+dosage/i.test(line)) {
      inDosage = true;
      continue;
    }
    if (inDosage && /^##\s/.test(line)) break;
    if (inDosage && line.trim()) {
      dosageText += ' ' + line.trim();
    }
  }

  dosageText = dosageText.trim();
  if (!dosageText) return null;

  // Parse pattern: "3-5 x 6-15 reps Repos 60-90 s" or "3-5 x 20-60 s Repos 30-60 s"
  const setsMatch = dosageText.match(/^(\d[\d\-–]*)\s*[x×]/i);
  const sets = setsMatch ? setsMatch[1].replace('–', '-') : null;

  // Extract reps or duration after "x"
  const afterX = dosageText.match(/[x×]\s*(.+?)(?:\s+repos\b|$)/i);
  const reps = afterX ? afterX[1].trim().replace(/\.$/, '') : null;

  // Extract rest
  const restMatch = dosageText.match(/repos\s+(.+?)(?:\s{2,}|\.?\s*$)/i);
  const rest = restMatch ? restMatch[1].trim().replace(/\.$/, '') : null;

  // Extract trailing note (quality cue after rest)
  const noteMatch = dosageText.match(/repos\s+[\d\-–]+\s*s?\s+(.+)/i);
  const note = noteMatch && !/^\d/.test(noteMatch[1]) ? noteMatch[1].trim().replace(/\.$/, '') : null;

  if (!sets && !reps && !rest) return null;
  return { sets, reps, rest, note };
}

interface ExerciseQuickInfoProps {
  content: string;
  securite: string;
}

export function ExerciseQuickInfo({ content, securite }: ExerciseQuickInfoProps) {
  const dosage = parseDosage(content);

  if (!dosage) return null;

  const { sets, reps, rest, note } = dosage;
  const hasData = sets || reps || rest;
  if (!hasData) return null;

  const safetyTip = securite
    ? securite.split(/[.!]/).filter((s) => s.trim().length > 10)[0]?.trim()
    : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0c18] p-4">
      {/* Title */}
      <div className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-3">
        Dosage recommand\u00e9
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {sets && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">S\u00e9ries</div>
            <div className="font-[var(--font-bebas)] text-2xl font-bold text-white">{sets}</div>
          </div>
        )}
        {reps && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">
              {/rep/i.test(reps) ? 'Reps' : 'Dur\u00e9e'}
            </div>
            <div className="font-[var(--font-bebas)] text-2xl font-bold text-white">
              {reps.replace(/\s*reps?/i, '')}
            </div>
          </div>
        )}
        {rest && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">Repos</div>
            <div className="font-[var(--font-bebas)] text-2xl font-bold text-white">{rest}</div>
          </div>
        )}
      </div>

      {/* Note (quality cue) */}
      {note && (
        <div className="mt-3 text-sm italic text-white/70">
          {"\uD83C\uDFAF"} Focus : {note}
        </div>
      )}

      {/* Context subtitle */}
      <div className="mt-3 text-xs italic text-white/40">
        Adapte selon ta m\u00e9thode et ton objectif{" \u2192 "}
        <LocaleLink href="/methodes" className="underline text-white/50 hover:text-white/70 transition-colors">
          M\u00e9thodes
        </LocaleLink>
      </div>

      {/* Safety tip */}
      {safetyTip && (
        <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300/90 leading-relaxed">
          <span className="font-semibold">S\u00e9curit\u00e9 :</span> {safetyTip}
        </div>
      )}
    </div>
  );
}
