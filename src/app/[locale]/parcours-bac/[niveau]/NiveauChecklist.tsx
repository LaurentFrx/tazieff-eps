"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  NIVEAUX,
  AUTO_EVAL,
  storageKey,
  type Niveau,
  type Competence,
} from "../data";

const COMPETENCE_ICONS: Record<Competence, string> = {
  realiser: "\u{1F3CB}\uFE0F",
  concevoir: "\u{1F4CB}",
  analyser: "\u{1F50D}",
  cooperer: "\u{1F91D}",
};

export function NiveauChecklist({ niveau }: { niveau: Niveau }) {
  const { t } = useI18n();
  const data = NIVEAUX.find((n) => n.key === niveau);

  const [checks, setChecks] = useState<Record<string, boolean[]>>({});
  const [evalAnswers, setEvalAnswers] = useState<(number | null)[]>([]);

  /* ── Load from localStorage ─────────────────────────────────── */
  useEffect(() => {
    if (!data) return;
    const loaded: Record<string, boolean[]> = {};
    for (const comp of data.competences) {
      const key = storageKey(niveau, comp.key);
      try {
        const raw = localStorage.getItem(key);
        loaded[key] = raw
          ? (JSON.parse(raw) as boolean[])
          : new Array(comp.items.length).fill(false);
      } catch {
        loaded[key] = new Array(comp.items.length).fill(false);
      }
    }
    setChecks(loaded);

    // Load auto-eval answers
    try {
      const raw = localStorage.getItem(`parcours-eval-${niveau}`);
      if (raw) {
        setEvalAnswers(JSON.parse(raw) as (number | null)[]);
      } else {
        setEvalAnswers(new Array(AUTO_EVAL[niveau].length).fill(null));
      }
    } catch {
      setEvalAnswers(new Array(AUTO_EVAL[niveau].length).fill(null));
    }
  }, [niveau, data]);

  /* ── Toggle a checkbox ──────────────────────────────────────── */
  const toggle = useCallback(
    (competence: Competence, index: number) => {
      const key = storageKey(niveau, competence);
      setChecks((prev) => {
        const arr = [...(prev[key] ?? [])];
        arr[index] = !arr[index];
        const next = { ...prev, [key]: arr };
        try {
          localStorage.setItem(key, JSON.stringify(arr));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [niveau],
  );

  /* ── Answer auto-eval ───────────────────────────────────────── */
  const answerEval = useCallback(
    (qIndex: number, score: number) => {
      setEvalAnswers((prev) => {
        const next = [...prev];
        next[qIndex] = score;
        try {
          localStorage.setItem(
            `parcours-eval-${niveau}`,
            JSON.stringify(next),
          );
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [niveau],
  );

  if (!data) return null;

  const questions = AUTO_EVAL[niveau];
  const evalTotal = questions.length * 2;
  const evalScore = evalAnswers.reduce<number>(
    (sum, v) => sum + (v ?? 0),
    0,
  );
  const allAnswered = evalAnswers.every((v) => v !== null);

  return (
    <div className="stack-lg">
      {/* ── Competency checklists ── */}
      {data.competences.map((comp) => {
        const key = storageKey(niveau, comp.key);
        const arr = checks[key] ?? [];
        const done = arr.filter(Boolean).length;

        return (
          <section key={comp.key} className="card parcours-comp-card">
            <h2>
              {COMPETENCE_ICONS[comp.key]}{" "}
              {t(`parcours.competence.${comp.key}`)}
              <span className="parcours-comp-count">
                {done}/{comp.items.length}
              </span>
            </h2>

            <ul className="parcours-checklist">
              {comp.items.map((item, i) => (
                <li key={i} className="parcours-checklist-item">
                  <label className="parcours-checklist-label">
                    <input
                      type="checkbox"
                      checked={arr[i] ?? false}
                      onChange={() => toggle(comp.key, i)}
                      className="parcours-checkbox"
                    />
                    <span>{item.text}</span>
                  </label>
                  {item.link && (
                    <Link
                      href={item.link}
                      className="parcours-checklist-link"
                    >
                      {t("parcours.seeMore")}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {/* ── Auto-evaluation ── */}
      <section className="card parcours-eval-card">
        <h2>{t("parcours.autoEval.title")}</h2>
        <p>{t("parcours.autoEval.subtitle")}</p>

        <div className="parcours-eval-questions">
          {questions.map((q, qi) => (
            <div key={qi} className="parcours-eval-question">
              <p className="parcours-eval-q-text">{q.question}</p>
              <div className="parcours-eval-options">
                {q.options.map((opt) => (
                  <button
                    key={opt.score}
                    type="button"
                    className={`parcours-eval-option${evalAnswers[qi] === opt.score ? " is-selected" : ""}`}
                    onClick={() => answerEval(qi, opt.score)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {allAnswered && (
          <div className="parcours-eval-result">
            <p>
              {t("parcours.autoEval.result")}{" "}
              <strong>
                {evalScore}/{evalTotal}
              </strong>
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {evalScore <= 2
                ? t("parcours.autoEval.level0")
                : evalScore <= 4
                  ? t("parcours.autoEval.level1")
                  : t("parcours.autoEval.level2")}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
