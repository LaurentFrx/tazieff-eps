'use client';

import { LocaleLink } from "@/components/LocaleLink";

interface DosageData {
  sets: string | null;
  reps: string | null;
  rest: string | null;
  note: string | null;
}

function extractSection(content: string, heading: RegExp): string {
  const lines = content.split('\n');
  let inSection = false;
  let text = '';
  for (const line of lines) {
    if (heading.test(line)) { inSection = true; continue; }
    if (inSection && /^##\s/.test(line)) break;
    if (inSection && line.trim()) text += ' ' + line.trim();
  }
  return text.trim();
}

function tryParseDosageText(dosageText: string): DosageData | null {
  if (!dosageText || /contenu\s+[aà]\s+compl/i.test(dosageText)) return null;

  // Parse sets: "3-5 x ..."
  const setsMatch = dosageText.match(/^(\d[\d\-–]*)\s*[x×]/i);
  const sets = setsMatch ? setsMatch[1].replace('–', '-') : null;

  // Helper: strip leading/trailing dashes, en-dashes, whitespace
  const cleanValue = (v: string) => v.replace(/^[\s\-–]+|[\s\-–]+$/g, '').trim();

  // Parse reps/duration after "x": everything up to "Repos" or end
  const afterX = dosageText.match(/[x×]\s*(.+?)(?:\s+[Rr]epos\b|$)/i);
  let reps = afterX ? cleanValue(afterX[1].replace(/\.$/, '')) : null;

  // Parse rest: extract only the numeric time value after "Repos"
  let rest: string | null = null;
  let note: string | null = null;

  const reposMatch = dosageText.match(/[Rr]epos\s+(.+)/i);
  if (reposMatch) {
    const afterRepos = reposMatch[1].trim();
    // Extract time pattern: digits with optional dash/range + unit
    const timeMatch = afterRepos.match(/^(\d[\d\-–']*\s*(?:s|sec|min|'|mn)?)/i);
    if (timeMatch) {
      rest = cleanValue(timeMatch[1].replace('–', '-').replace(/\.$/, ''));
      // Everything after the time value is the note
      const remaining = cleanValue(afterRepos.slice(timeMatch[0].length).replace(/^\.*\s*/, '').replace(/\.$/, ''));
      if (remaining.length > 3) {
        note = remaining;
      }
    } else {
      // No numeric pattern — entire value is rest description
      rest = cleanValue(afterRepos.replace(/\.$/, ''));
    }
  }

  // A2: If reps contains "par côté/bras/jambe", move it to focus
  if (reps && /\bpar\b/i.test(reps)) {
    const [num, ...extra] = reps.split(/\s+par\s+/i);
    reps = cleanValue(num.replace(/\s*reps?/i, ''));
    const focusExtra = 'par ' + extra.join(' ');
    note = note ? `${focusExtra}. ${note}` : focusExtra;
    // Restore "reps" in reps value for label detection
    if (/rep/i.test(afterX?.[1] ?? '')) reps = reps + ' reps';
  }

  if (!sets && !reps && !rest) return null;
  return { sets, reps, rest, note };
}

function parseDosage(content: string): DosageData | null {
  // 1. Try ## Dosage section
  const dosageText = extractSection(content, /^##\s+dosage/i);
  const fromDosage = tryParseDosageText(dosageText);
  if (fromDosage) return fromDosage;

  // 2. Fallback: look for dosage pattern in ## Conseils (e.g. "Dosage indicatif : 2-4 x 3-5 reps")
  const conseilsText = extractSection(content, /^##\s+conseils?/i);
  const dosageLine = conseilsText.match(/dosage[^:]*:\s*(.+)/i);
  if (dosageLine) {
    const fromConseils = tryParseDosageText(dosageLine[1]);
    if (fromConseils) return fromConseils;
  }

  // 3. Fallback: look for dosage lines in ## Exécution
  const execText = extractSection(content, /^##\s+ex[eé]cution/i);
  const execDosage = execText.match(/(\d[\d\-–]*\s*[x×]\s*.+)/i);
  if (execDosage) {
    const fromExec = tryParseDosageText(execDosage[1]);
    if (fromExec) return fromExec;
  }

  return null;
}

export type { DosageData };
export { parseDosage };

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
      <LocaleLink href="/methodes" className="mt-2 block text-xs italic text-white/30 hover:text-white/50 transition-colors">
        Adapte selon ta méthode et ton objectif → <span className="text-[#FF8C00]">Méthodes</span>
      </LocaleLink>

      {/* Safety tip */}
      {safetyTip && (
        <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300/90 leading-relaxed">
          <span className="font-semibold">Sécurité :</span> {safetyTip}
        </div>
      )}
    </div>
  );
}
