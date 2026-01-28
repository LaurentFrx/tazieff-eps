"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DifficultyPill from "@/components/DifficultyPill";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { HeroMedia } from "@/components/media/HeroMedia";
import s1001 from "../../../../public/images/exos/s1-001.webp";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import { ExerciseFrontmatterSchema } from "@/lib/content/schema";
import type { Lang } from "@/lib/i18n/messages";
import { mdxComponents } from "@/lib/mdx/components";
import { applyExercisePatch, splitMarkdownSections, type MarkdownSection } from "@/lib/live/patch";
import type { ExercisePatch, LiveExerciseRow } from "@/lib/live/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ExerciseLiveDetailProps = {
  slug: string;
  locale: Lang;
  source: "mdx" | "live";
  baseFrontmatter: ExerciseFrontmatter;
  baseContent: string;
  initialPatch: ExercisePatch | null;
};

type LiveDraft = {
  slug: string;
  title: string;
  tags: string;
  muscles: string;
  themeCompatibility: string;
  level: string;
  equipment: string;
  media: string;
  content: string;
};

const POLL_INTERVAL_MS = 20000;
const LONG_PRESS_MS = 1800;
const MOVE_THRESHOLD_PX = 10;

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseThemeCompatibility(value: string) {
  return parseList(value)
    .map((item) => Number(item))
    .filter((item) => item === 1 || item === 2 || item === 3) as Array<1 | 2 | 3>;
}

export function ExerciseLiveDetail({
  slug,
  locale,
  source,
  baseFrontmatter,
  baseContent,
  initialPatch,
}: ExerciseLiveDetailProps) {
  const supabase = getSupabaseBrowserClient();
  const [base, setBase] = useState(() => ({
    frontmatter: baseFrontmatter,
    content: baseContent,
  }));
  const [patch, setPatch] = useState<ExercisePatch | null>(() => initialPatch);
  const [overrideReady, setOverrideReady] = useState(false);
  const [liveReady, setLiveReady] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const [teacherPin, setTeacherPin] = useState("");
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideSections, setOverrideSections] = useState<MarkdownSection[]>([]);
  const [newSectionHeading, setNewSectionHeading] = useState("");
  const [newSectionBody, setNewSectionBody] = useState("");
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveDraft, setLiveDraft] = useState<LiveDraft | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchPointerActiveRef = useRef(false);

  const merged = useMemo(
    () => applyExercisePatch(base, patch),
    [base, patch],
  );

  const isLive = source === "live" || !!patch;
  const difficulty = merged.frontmatter.level ?? "intermediaire";
  const heroImage = merged.frontmatter.media
    ? {
        "/images/exos/s1-001.webp": s1001,
      }[merged.frontmatter.media]
    : undefined;

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    let retry = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let channel = supabase.channel(`exercise-overrides-${slug}-${locale}`);

    const setupChannel = () => {
      channel = supabase.channel(`exercise-overrides-${slug}-${locale}`);
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exercise_overrides",
          filter: `slug=eq.${slug}`,
        },
        (payload) => {
          if (!active) {
            return;
          }
          const rowLocale =
            payload.eventType === "DELETE"
              ? (payload.old as { locale?: string })?.locale
              : (payload.new as { locale?: string })?.locale;
          if (rowLocale && rowLocale !== locale) {
            return;
          }
          if (payload.eventType === "DELETE") {
            setPatch(null);
            return;
          }
          const nextPatch = (payload.new as { patch_json?: ExercisePatch }).patch_json;
          setPatch(nextPatch ?? null);
        },
      );
      channel.subscribe((status) => {
        if (!active) {
          return;
        }
        if (status === "SUBSCRIBED") {
          retry = 0;
          setOverrideReady(true);
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setOverrideReady(false);
          channel.unsubscribe();
          retryTimeout = setTimeout(
            setupChannel,
            Math.min(30000, 2000 * Math.pow(2, retry)),
          );
          retry += 1;
        }
      });
    };

    setupChannel();

    return () => {
      active = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [locale, slug, supabase]);

  useEffect(() => {
    if (!supabase || source !== "live") {
      return;
    }

    let active = true;
    let retry = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let channel = supabase.channel(`live-exercise-${slug}-${locale}`);

    const setupChannel = () => {
      channel = supabase.channel(`live-exercise-${slug}-${locale}`);
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_exercises",
          filter: `slug=eq.${slug}`,
        },
        (payload) => {
          if (!active) {
            return;
          }
          const rowLocale =
            payload.eventType === "DELETE"
              ? (payload.old as { locale?: string })?.locale
              : (payload.new as { locale?: string })?.locale;
          if (rowLocale && rowLocale !== locale) {
            return;
          }
          if (payload.eventType === "DELETE") {
            return;
          }
          const row = payload.new as LiveExerciseRow;
          if (row?.data_json) {
            setBase({
              frontmatter: row.data_json.frontmatter,
              content: row.data_json.content,
            });
          }
        },
      );
      channel.subscribe((status) => {
        if (!active) {
          return;
        }
        if (status === "SUBSCRIBED") {
          retry = 0;
          setLiveReady(true);
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLiveReady(false);
          channel.unsubscribe();
          retryTimeout = setTimeout(
            setupChannel,
            Math.min(30000, 2000 * Math.pow(2, retry)),
          );
          retry += 1;
        }
      });
    };

    setupChannel();

    return () => {
      active = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [locale, slug, source, supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const shouldPoll = !overrideReady || (source === "live" && !liveReady);
    if (!shouldPoll) {
      return;
    }

    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchOverride = async () => {
      const { data } = await supabase
        .from("exercise_overrides")
        .select("slug, locale, patch_json, updated_at")
        .eq("slug", slug)
        .eq("locale", locale)
        .maybeSingle();
      if (!active) {
        return;
      }
      setPatch(data?.patch_json ?? null);
    };

    const fetchLive = async () => {
      if (source !== "live") {
        return;
      }
      const { data } = await supabase
        .from("live_exercises")
        .select("slug, locale, data_json, updated_at")
        .eq("slug", slug)
        .eq("locale", locale)
        .maybeSingle();
      if (!active || !data?.data_json) {
        return;
      }
      setBase({
        frontmatter: data.data_json.frontmatter,
        content: data.data_json.content,
      });
    };

    const fetchLatest = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      await Promise.all([fetchOverride(), fetchLive()]);
    };

    fetchLatest();
    interval = setInterval(fetchLatest, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchLatest();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [locale, liveReady, overrideReady, slug, source, supabase]);

  const openPinModal = () => {
    if (teacherUnlocked) {
      return;
    }
    setPinModalOpen(true);
  };

  const startLongPress = (x: number, y: number) => {
    if (teacherUnlocked) {
      return;
    }
    pressStartRef.current = { x, y };
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      openPinModal();
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressStartRef.current = null;
  };

  const cancelLongPressOnMove = (x: number, y: number) => {
    const start = pressStartRef.current;
    if (!start) {
      return;
    }
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.hypot(dx, dy) > MOVE_THRESHOLD_PX) {
      cancelLongPress();
    }
  };

  const openOverrideEditor = () => {
    setSubmitStatus(null);
    const sections = splitMarkdownSections(merged.content).sections;
    setOverrideSections(sections);
    setNewSectionHeading("");
    setNewSectionBody("");
    setOverrideOpen(true);
  };

  const openLiveEditor = () => {
    setSubmitStatus(null);
    setLiveDraft({
      slug: "",
      title: merged.frontmatter.title,
      tags: merged.frontmatter.tags.join(", "),
      muscles: merged.frontmatter.muscles.join(", "),
      themeCompatibility: merged.frontmatter.themeCompatibility.join(", "),
      level: merged.frontmatter.level ?? "",
      equipment: merged.frontmatter.equipment?.join(", ") ?? "",
      media: merged.frontmatter.media ?? "",
      content: merged.content,
    });
    setLiveOpen(true);
  };

  const handleUnlock = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!teacherPin.trim()) {
      setTeacherError("PIN requis.");
      return;
    }
    setTeacherUnlocked(true);
    setTeacherError(null);
    setPinModalOpen(false);
  };

  const handleAuthError = (message: string) => {
    setTeacherUnlocked(false);
    setTeacherPin("");
    setTeacherError(message);
    setPinModalOpen(true);
  };

  const handleSaveOverride = async () => {
    if (!teacherPin) {
      handleAuthError("PIN requis.");
      return;
    }
    const patchJson: ExercisePatch = {
      sections: overrideSections.reduce<Record<string, string>>((acc, section) => {
        acc[section.heading] = section.body;
        return acc;
      }, {}),
    };
    if (newSectionHeading.trim()) {
      patchJson.sections = patchJson.sections ?? {};
      patchJson.sections[newSectionHeading.trim()] = newSectionBody;
    }
    setSubmitStatus("Envoi en cours...");
    const response = await fetch("/api/teacher/exercise-override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin: teacherPin,
        slug,
        locale,
        patchJson,
      }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError("PIN invalide.");
        setSubmitStatus(null);
        return;
      }
      setSubmitStatus("Échec de l'envoi.");
      return;
    }
    setPatch(patchJson);
    setSubmitStatus("Correction enregistrée.");
    setOverrideOpen(false);
  };

  const handleSaveLive = async () => {
    if (!teacherPin) {
      handleAuthError("PIN requis.");
      return;
    }
    if (!liveDraft) {
      return;
    }
    const frontmatter = ExerciseFrontmatterSchema.safeParse({
      title: liveDraft.title,
      slug: liveDraft.slug,
      tags: parseList(liveDraft.tags),
      level: liveDraft.level || undefined,
      themeCompatibility: parseThemeCompatibility(liveDraft.themeCompatibility),
      muscles: parseList(liveDraft.muscles),
      equipment: liveDraft.equipment ? parseList(liveDraft.equipment) : undefined,
      media: liveDraft.media || undefined,
    });
    if (!frontmatter.success) {
      setSubmitStatus("Champs invalides (titre, slug, tags, muscles, thèmes).");
      return;
    }
    const response = await fetch("/api/teacher/live-exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin: teacherPin,
        slug: frontmatter.data.slug,
        locale,
        dataJson: {
          frontmatter: frontmatter.data,
          content: liveDraft.content,
        },
      }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError("PIN invalide.");
        setSubmitStatus(null);
        return;
      }
      setSubmitStatus("Échec de la création.");
      return;
    }
    setSubmitStatus("Exercice LIVE créé.");
    setLiveOpen(false);
  };

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Exercices</p>
        <div
          role="button"
          tabIndex={0}
          onPointerDown={(event) => {
            if (event.ctrlKey || event.shiftKey) {
              event.preventDefault();
              cancelLongPress();
              openPinModal();
              return;
            }
            if (event.pointerType === "touch") {
              touchPointerActiveRef.current = true;
            } else {
              event.preventDefault();
            }
            startLongPress(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            cancelLongPressOnMove(event.clientX, event.clientY);
          }}
          onPointerUp={() => {
            cancelLongPress();
            touchPointerActiveRef.current = false;
          }}
          onPointerLeave={() => {
            cancelLongPress();
            touchPointerActiveRef.current = false;
          }}
          onPointerCancel={() => {
            cancelLongPress();
            touchPointerActiveRef.current = false;
          }}
          onMouseDown={(event) => {
            if (event.ctrlKey || event.shiftKey) {
              event.preventDefault();
              cancelLongPress();
              openPinModal();
              return;
            }
            event.preventDefault();
          }}
          onTouchStart={(event) => {
            if (touchPointerActiveRef.current) {
              return;
            }
            const touch = event.touches[0];
            if (!touch) {
              return;
            }
            startLongPress(touch.clientX, touch.clientY);
          }}
          onTouchMove={(event) => {
            if (touchPointerActiveRef.current) {
              return;
            }
            const touch = event.touches[0];
            if (!touch) {
              return;
            }
            cancelLongPressOnMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={() => {
            cancelLongPress();
            touchPointerActiveRef.current = false;
          }}
          onTouchCancel={() => {
            cancelLongPress();
            touchPointerActiveRef.current = false;
          }}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
          onClick={(event) => {
            if (event.ctrlKey || event.shiftKey) {
              event.preventDefault();
              cancelLongPress();
              openPinModal();
            }
          }}
          onKeyDown={(event) => {
            if (teacherUnlocked) {
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPinModal();
            }
          }}
          className="title-longpress"
        >
          <h1>{merged.frontmatter.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyPill level={difficulty} />
          {isLive ? <span className="pill pill-live">LIVE</span> : null}
          {merged.frontmatter.muscles.map((muscle) => (
            <span key={muscle} className="pill">
              {muscle}
            </span>
          ))}
        </div>
        {heroImage ? (
          <HeroMedia src={heroImage} alt={merged.frontmatter.title} priority />
        ) : null}
        <div className="meta-row">
          <FavoriteToggle slug={merged.frontmatter.slug} />
          <span className="meta-text">
            Thèmes compatibles: {merged.frontmatter.themeCompatibility.join(", ")}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {merged.frontmatter.tags.map((tag) => (
            <span key={tag} className="pill">
              {tag}
            </span>
          ))}
        </div>
        {merged.frontmatter.equipment && merged.frontmatter.equipment.length > 0 ? (
          <div className="text-sm text-[color:var(--muted)]">
            Matériel: {merged.frontmatter.equipment.join(", ")}
          </div>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">Sans matériel spécifique.</div>
        )}
      </header>

      {teacherUnlocked ? (
        <div className="teacher-panel">
          <p className="eyebrow">Mode prof</p>
          <div className="modal-actions">
            <button
              type="button"
              className="primary-button primary-button--wide"
              onClick={openOverrideEditor}
            >
              Corriger cette fiche
            </button>
            <button
              type="button"
              className="primary-button primary-button--wide"
              onClick={openLiveEditor}
            >
              Créer un exercice LIVE
            </button>
          </div>
          {submitStatus ? (
            <p className="text-xs text-[color:var(--muted)]">{submitStatus}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdxComponents}>
          {merged.content}
        </ReactMarkdown>
      </div>

      {pinModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>PIN professeur</h2>
            <form onSubmit={handleUnlock} className="stack-md">
              <input
                className="field-input"
                type="password"
                inputMode="numeric"
                autoFocus
                placeholder="••••"
                value={teacherPin}
                onChange={(event) => setTeacherPin(event.target.value)}
              />
              {teacherError ? (
                <p className="text-xs text-[color:var(--muted)]">{teacherError}</p>
              ) : null}
              <div className="modal-actions">
                <button type="submit" className="primary-button primary-button--wide">
                  Déverrouiller
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setPinModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {overrideOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>Corriger la fiche</h2>
            <div className="stack-md">
              {overrideSections.map((section, index) => (
                <div key={section.heading} className="stack-md">
                  <label className="field-label">## {section.heading}</label>
                  <textarea
                    className="field-textarea"
                    value={section.body}
                    autoFocus={index === 0}
                    onChange={(event) => {
                      const value = event.target.value;
                      setOverrideSections((prev) =>
                        prev.map((item) =>
                          item.heading === section.heading
                            ? { ...item, body: value }
                            : item,
                        ),
                      );
                    }}
                  />
                </div>
              ))}
              <div className="stack-md">
                <label className="field-label">Ajouter une section</label>
                <input
                  className="field-input"
                  placeholder="Titre de section"
                  value={newSectionHeading}
                  onChange={(event) => setNewSectionHeading(event.target.value)}
                />
                <textarea
                  className="field-textarea"
                  placeholder="Contenu"
                  value={newSectionBody}
                  onChange={(event) => setNewSectionBody(event.target.value)}
                />
              </div>
            </div>
            {submitStatus ? (
              <p className="text-xs text-[color:var(--muted)]">{submitStatus}</p>
            ) : null}
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button primary-button--wide"
                onClick={handleSaveOverride}
              >
                Enregistrer
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setOverrideOpen(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {liveOpen && liveDraft ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>Créer un exercice LIVE</h2>
            <div className="stack-md">
              <label className="field-label">Slug</label>
              <input
                className="field-input"
                value={liveDraft.slug}
                placeholder="ex: sprint-30m"
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, slug: event.target.value })
                }
              />
              <label className="field-label">Titre</label>
              <input
                className="field-input"
                value={liveDraft.title}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, title: event.target.value })
                }
              />
              <label className="field-label">Tags (séparés par des virgules)</label>
              <input
                className="field-input"
                value={liveDraft.tags}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, tags: event.target.value })
                }
              />
              <label className="field-label">Muscles</label>
              <input
                className="field-input"
                value={liveDraft.muscles}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, muscles: event.target.value })
                }
              />
              <label className="field-label">Thèmes compatibles (1, 2, 3)</label>
              <input
                className="field-input"
                value={liveDraft.themeCompatibility}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, themeCompatibility: event.target.value })
                }
              />
              <label className="field-label">Niveau</label>
              <input
                className="field-input"
                value={liveDraft.level}
                placeholder="debutant / intermediaire / avance"
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, level: event.target.value })
                }
              />
              <label className="field-label">Matériel</label>
              <input
                className="field-input"
                value={liveDraft.equipment}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, equipment: event.target.value })
                }
              />
              <label className="field-label">Média (optionnel)</label>
              <input
                className="field-input"
                value={liveDraft.media}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, media: event.target.value })
                }
              />
              <label className="field-label">Contenu</label>
              <textarea
                className="field-textarea"
                autoFocus
                value={liveDraft.content}
                onChange={(event) =>
                  setLiveDraft({ ...liveDraft, content: event.target.value })
                }
              />
            </div>
            {submitStatus ? (
              <p className="text-xs text-[color:var(--muted)]">{submitStatus}</p>
            ) : null}
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button primary-button--wide"
                onClick={handleSaveLive}
              >
                Créer
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setLiveOpen(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
