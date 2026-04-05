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

  // Parse sets: "3-5 x ..."
  const setsMatch = dosageText.match(/^(\d[\d\-–]*)\s*[x×]/i);
  const sets = setsMatch ? setsMatch[1].replace('–', '-') : null;

  // Parse reps/duration after "x": everything up to "Repos" or end
  const afterX = dosageText.match(/[x×]\s*(.+?)(?:\s+[Rr]epos\b|$)/i);
  const reps = afterX ? afterX[1].trim().replace(/\.$/, '') : null;

  // Parse rest: extract only the numeric time value after "Repos"
  let rest: string | null = null;
  let note: string | null = null;

  const reposMatch = dosageText.match(/[Rr]epos\s+(.+)/i);
  if (reposMatch) {
    const afterRepos = reposMatch[1].trim();
    // Extract time pattern: digits with optional dash/range + unit
    const timeMatch = afterRepos.match(/^(\d[\d\-–']*\s*(?:s|sec|min|'|mn)?)/i);
    if (timeMatch) {
      rest = timeMatch[1].trim().replace('–', '-').replace(/\.$/, '');
      // Everything after the time value is the note
      const remaining = afterRepos.slice(timeMatch[0].length).trim().replace(/^\.*\s*/, '').replace(/\.$/, '');
      if (remaining.length > 3) {
        note = remaining;
      }
    } else {
      // No numeric pattern — entire value is rest description
      rest = afterRepos.replace(/\.$/, '');
    }
  }

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

  const columns = [
    sets ? { label: 'Séries', value: sets } : null,
    reps ? { label: /rep/i.test(reps) ? 'Reps' : 'Durée', value: reps.replace(/\s*reps?/i, '') } : null,
    rest ? { label: 'Repos', value: rest } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      {/* Title */}
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-4">
        Dosage recommandé
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {columns.map((col, i) => (
          <div
            key={col.label}
            className={`text-center ${i < columns.length - 1 ? 'border-r border-white/10' : ''}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-1">
              {col.label}
            </div>
            <div className="font-[var(--font-bebas)] text-2xl font-bold text-white">
              {col.value}
            </div>
          </div>
        ))}
      </div>

      {/* Note (quality cue) */}
      {note && (
        <div className="mt-4 text-sm italic text-white/60">
          🎯 Focus : {note}
        </div>
      )}

      {/* Context subtitle */}
      <div className="mt-2 text-xs italic text-white/30">
        Adapte selon ta méthode et ton objectif →{" "}
        <LocaleLink href="/methodes" className="text-cyan-400 hover:text-cyan-300 transition-colors">
          Méthodes
        </LocaleLink>
      </div>

      {/* Safety tip */}
      {safetyTip && (
        <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300/90 leading-relaxed">
          <span className="font-semibold">Sécurité :</span> {safetyTip}
        </div>
      )}
    </div>
  );
}
