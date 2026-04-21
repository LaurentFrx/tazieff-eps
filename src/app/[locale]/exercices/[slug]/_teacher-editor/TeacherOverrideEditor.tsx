// Phase B.2 — lazy-loaded teacher override editor component.
// Consumes the 4 thematic contexts (doc, media, pills, UI) via hooks.
// Receives parent-level memos (merged, pillState, saveMeta, etc.) as props.
//
// Rendered conditionally by the parent via next/dynamic(ssr: false).
// Only downloaded when the teacher unlocks editor mode.

"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Lang } from "@/lib/i18n/messages";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import type { ExerciseRenderOverride } from "@/lib/live/patch";
import type {
  ExerciseLiveDocV2,
  ExerciseOverridePatch,
} from "@/lib/live/types";
import {
  useOverrideDocContext,
  useOverrideMediaContext,
  useOverridePillsContext,
  useOverrideUIContext,
  type PillState,
  type SaveMeta,
} from "./contexts";
import {
  HERO_OVERRIDE_DIMENSIONS,
  IMAGE_ACCEPT,
  appendCacheBust,
  formatMediaInfo,
  mediaUrlCache,
} from "./lib/media-utils";
import {
  DROPDOWN_MAX_HEIGHT,
  filterOptions,
  normalizeKey,
  normalizeLabel,
  optionExists,
} from "./lib/pill-utils";

// ── CSS class constants, duplicated from parent (only used in JSX modal) ──
const DROPDOWN_MENU_LAYER_CLASS = "z-[80]";
const DROPDOWN_MENU_PANEL_CLASS =
  "rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-2 shadow-xl";

// Silence unused warnings — HERO_OVERRIDE_DIMENSIONS kept for future use
void HERO_OVERRIDE_DIMENSIONS;
void appendCacheBust;

// ── Local PhotoPreview (used only inside this component) ──────────────────
type PhotoPreviewProps = {
  previewUrl: string | null;
  alt: string;
  infoLine?: string | null;
  isResolving: boolean;
  hasError: boolean;
  errorDetail?: string | null;
  onRetry: () => void;
};

function PhotoPreview({
  previewUrl,
  alt,
  infoLine,
  isResolving,
  hasError,
  errorDetail,
  onRetry,
}: PhotoPreviewProps) {
  const [retryToken, setRetryToken] = useState(0);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [loadErrorFor, setLoadErrorFor] = useState<string | null>(null);

  const displayUrl = previewUrl ? appendCacheBust(previewUrl, retryToken) : null;
  const loadError = !!displayUrl && loadErrorFor === displayUrl;
  const isLoading = !!displayUrl && loadedUrl !== displayUrl && !loadError;
  const showError = loadError || (!displayUrl && hasError);
  const showSkeleton = !showError && (isResolving || isLoading);
  const frameClassName =
    "h-[220px] sm:h-[240px] w-full rounded-2xl ring-1 ring-white/10";
  const { t: tPreview } = useI18n();
  const resolvedErrorDetail = showError
    ? loadError
      ? tPreview("exerciseEditor.urlError")
      : errorDetail || tPreview("exerciseEditor.urlError")
    : null;

  const handleRetryClick = () => {
    setLoadErrorFor(null);
    setRetryToken((current) => current + 1);
    onRetry();
  };

  return (
    <div className="stack-sm">
      {showError ? (
        <div
          className={`flex ${frameClassName} flex-col items-center justify-center gap-2 border border-white/10 bg-white/5 px-4 text-center`}
        >
          <p className="text-sm text-[color:var(--muted)]">
            {tPreview("exerciseEditor.previewUnavailable")}
          </p>
          {resolvedErrorDetail ? (
            <p className="text-xs text-[color:var(--muted)]">
              {resolvedErrorDetail}
            </p>
          ) : null}
          <button type="button" className="chip" onClick={handleRetryClick}>
            {tPreview("exerciseEditor.retry")}
          </button>
        </div>
      ) : (
        <div className="relative">
          {showSkeleton ? (
            <div
              className={`${frameClassName} animate-pulse bg-white/5`}
              aria-hidden="true"
            />
          ) : null}
          {displayUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt={alt}
                className={`${frameClassName} object-cover transition-opacity ${
                  showSkeleton ? "opacity-0" : "opacity-100"
                }`}
                loading="lazy"
                decoding="async"
                onLoad={() => {
                  if (displayUrl) {
                    setLoadedUrl(displayUrl);
                    setLoadErrorFor(null);
                  }
                }}
                onError={() => {
                  if (displayUrl) {
                    setLoadErrorFor(displayUrl);
                  }
                }}
              />
            </>
          ) : null}
        </div>
      )}
      {infoLine ? (
        <p className="text-xs text-[color:var(--muted)]">{infoLine}</p>
      ) : null}
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────
export type TeacherOverrideEditorProps = {
  slug: string;
  locale: Lang;
  merged: ExerciseRenderOverride;
  base: { frontmatter: ExerciseFrontmatter; content: string };
  patch: ExerciseOverridePatch | null;
  pillState: PillState;
  saveMeta: SaveMeta;
  displayTitle: string;
};

export default function TeacherOverrideEditor({
  slug,
  locale,
  merged,
  // base / patch kept for future use (hooks already own the mutation logic)
  base: _base,
  patch: _patch,
  pillState,
  saveMeta,
  displayTitle,
}: TeacherOverrideEditorProps) {
  const { t } = useI18n();
  void _base;
  void _patch;

  // ── 4 thematic contexts ────────────────────────────────────────────────
  const {
    overrideDoc,
    isDirty,
    isSavingOverride,
    overrideToast,
    submitStatus,
    handleSaveOverride,
    handleCloseOverride,
    handleCloseWithoutSave,
    handleDiscardOverride,
    updateSection,
  } = useOverrideDocContext();

  const {
    heroPreviewUrl,
    mediaStatus,
    mediaUrlMap,
    mediaInfoMap,
    mediaResolveState,
    mediaResolveError,
    fileInputRef,
    handlePhotoUploadRequest,
    handlePhotoFileChange,
    handleClearPhoto,
    handleHeroUrlChange,
    handleHeroAltChange,
    handleHeroPreview,
    handleHeroRemove,
    resolveMediaAsset,
  } = useOverrideMediaContext();

  const {
    pillDropdownOpen,
    pillSearch,
    pillDropdownStyle,
    levelAddOpen,
    levelAddValue,
    setPillSearch,
    setLevelAddOpen,
    setLevelAddValue,
    dropdownMenuRef,
    dropdownTriggerRefs,
    setLevelSelection,
    addCustomLevel,
    toggleMultiSelection,
    addCustomOption,
    toggleDropdown,
  } = useOverridePillsContext();

  const {
    activeSectionId,
    sectionMenuOpenId,
    blockMenuOpenKey,
    highlightBlockKey,
    addBlockMenuOpen,
    confirmCloseOpen,
    deleteLiveOpen,
    isDeletingLive,
    liveExists,
    teacherPin,
    setActiveSectionId,
    setSectionMenuOpenId,
    setBlockMenuOpenKey,
    setAddBlockMenuOpen,
    setConfirmCloseOpen,
    setDeleteLiveOpen,
    setTeacherPin,
    sectionTitleRefs,
    blockFieldRefs,
    blockContainerRefs,
    addBlockMenuRef,
    addBlockButtonRef,
    handleAddSection,
    handleMoveSection,
    handleRemoveSection,
    handleAddBlock,
    handleMoveBlock,
    handleRemoveBlock,
    handleAddFromMenu,
    handleDeleteLive,
    dismissBlockToast,
    blockToast,
    blockToastVisible,
  } = useOverrideUIContext();

  // ── Local derived values ───────────────────────────────────────────────
  const activeSection =
    overrideDoc?.doc.sections.find((section) => section.id === activeSectionId) ??
    (overrideDoc
      ? overrideDoc.doc.sections[overrideDoc.doc.sections.length - 1] ?? null
      : null);

  const filteredTypeOptions = useMemo(
    () => filterOptions(pillState.options.type, pillSearch.type),
    [pillState.options.type, pillSearch.type],
  );
  const filteredMuscleOptions = useMemo(
    () => filterOptions(pillState.options.muscles, pillSearch.muscles),
    [pillState.options.muscles, pillSearch.muscles],
  );
  const filteredThemeOptions = useMemo(
    () => filterOptions(pillState.options.themes, pillSearch.themes),
    [pillState.options.themes, pillSearch.themes],
  );

  // ── Local focus helpers (use refs from UI context) ─────────────────────
  const handleFocusSectionTitle = (sectionId: string) => {
    const input = sectionTitleRefs.current[sectionId];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const handleFocusBlock = (key: string) => {
    const field = blockFieldRefs.current[key];
    if (field) {
      field.focus();
      if ("select" in field) {
        field.select();
      }
    }
  };

  // ── JSX modal (copied verbatim from ExerciseLiveDetail.tsx L1957-3245) ─
  return (
    <>
      <div className="modal-overlay" role="dialog" aria-modal="true">
        <div className="modal-card flex max-h-[85vh] flex-col">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2>{t("exerciseEditor.fixSheet")}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {overrideToast ? (
                  <span className="text-xs text-[color:var(--muted)]">
                    {overrideToast.tone === "success"
                      ? "OK: "
                      : `${t("exerciseEditor.errorPrefix")} `}
                    {overrideToast.message}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="chip"
                  onClick={handleCloseOverride}
                >
                  ✕ {t("exerciseEditor.close")}
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pt-4">
            {isDirty ? (
              <div className="sticky top-0 z-20 mb-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/30 px-4 py-2 shadow-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                    <span
                      className="inline-flex h-2 w-2 rounded-full bg-amber-200"
                      aria-hidden="true"
                    />
                    {t("exerciseEditor.changesPending")}
                  </div>
                  <span className="text-xs text-amber-100/80">
                    {t("exerciseEditor.rememberToSave")}
                  </span>
                </div>
              </div>
            ) : null}
            {overrideDoc ? (
              <div className="stack-md">
                {liveExists ? (
                  <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 shadow-lg">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span aria-hidden="true">⚠️</span>
                          <h3 className="text-base font-semibold">
                            {t("exerciseEditor.savedVersion")}
                          </h3>
                          <span className="rounded-full border border-red-400/60 bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-100">
                            {t("exerciseEditor.activeVersion")}
                          </span>
                        </div>
                        <p className="text-sm text-[color:var(--muted)]">
                          {t("exerciseEditor.liveExistsWarning")}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="primary-button primary-button--wide bg-red-500 text-white hover:bg-red-600"
                        onClick={() => setDeleteLiveOpen(true)}
                      >
                        {t("exerciseEditor.deleteSaved")}…
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-4 shadow-lg">
                  <div className="stack-md">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold">
                        {t("exerciseEditor.categories")}
                      </h3>
                      <p className="text-sm text-[color:var(--muted)]">
                        {t("exerciseEditor.categoriesDesc")}
                      </p>
                    </div>
                    <div className="stack-md">
                      <div className="stack-sm">
                        <label className="field-label">
                          {t("exerciseEditor.levelLabel")}
                        </label>
                        <select
                          className="field-input"
                          value={pillState.selections.level}
                          onChange={(event) =>
                            setLevelSelection(event.target.value)
                          }
                        >
                          <option value="">
                            {t("exerciseEditor.levelPlaceholder")}
                          </option>
                          {pillState.options.level.map((option) => (
                            <option key={`level-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        {levelAddOpen ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              className="field-input"
                              placeholder={t("exerciseEditor.newLevelPlaceholder")}
                              value={levelAddValue}
                              onChange={(event) =>
                                setLevelAddValue(event.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="chip"
                              onClick={addCustomLevel}
                            >
                              {t("exerciseEditor.add")}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="chip chip-ghost w-fit"
                            onClick={() => setLevelAddOpen(true)}
                          >
                            {t("exerciseEditor.addLevel")}
                          </button>
                        )}
                      </div>

                      <div className="stack-sm">
                        <label className="field-label">
                          {t("exerciseEditor.typeLabel")}
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            className="field-input flex items-center justify-between"
                            ref={(node) => {
                              dropdownTriggerRefs.current.type = node;
                            }}
                            onClick={() => toggleDropdown("type")}
                          >
                            <span>
                              {pillState.selections.type.length > 0
                                ? `${pillState.selections.type.length} ${t(pillState.selections.type.length === 1 ? "exerciseEditor.selectedSingular" : "exerciseEditor.selectedPlural")}`
                                : t("exerciseEditor.selectPlaceholder")}
                            </span>
                            <span aria-hidden="true">▾</span>
                          </button>
                        </div>
                        {pillDropdownOpen === "type" && pillDropdownStyle
                          ? createPortal(
                              <div
                                ref={dropdownMenuRef}
                                className={DROPDOWN_MENU_LAYER_CLASS}
                                style={{
                                  position: "absolute",
                                  top: pillDropdownStyle.top,
                                  left: pillDropdownStyle.left,
                                  width: pillDropdownStyle.width,
                                }}
                              >
                                <div className={DROPDOWN_MENU_PANEL_CLASS}>
                                  <div className="sticky top-0 z-10 bg-[color:var(--bg-2)] pb-2">
                                    <input
                                      className="field-input"
                                      placeholder={t("exerciseEditor.searchPlaceholder")}
                                      value={pillSearch.type}
                                      onChange={(event) =>
                                        setPillSearch((prev) => ({
                                          ...prev,
                                          type: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div
                                    className="space-y-1 overflow-y-auto"
                                    style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
                                  >
                                    {filteredTypeOptions.map((option) => {
                                      const checked = pillState.selections.type.some(
                                        (value) =>
                                          normalizeKey(value) === normalizeKey(option),
                                      );
                                      return (
                                        <label
                                          key={`type-option-${option}`}
                                          className="flex min-h-[36px] items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              toggleMultiSelection("type", option)
                                            }
                                          />
                                          <span>{option}</span>
                                        </label>
                                      );
                                    })}
                                    {normalizeLabel(pillSearch.type) &&
                                    !optionExists(
                                      pillState.options.type,
                                      pillSearch.type,
                                    ) ? (
                                      <button
                                        type="button"
                                        className="chip w-full justify-start"
                                        onClick={() => addCustomOption("type")}
                                      >
                                        {`${t("exerciseEditor.add")} '${normalizeLabel(pillSearch.type)}'`}
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>,
                              document.body,
                            )
                          : null}
                        <div className="flex flex-wrap gap-2">
                          {pillState.selections.type.length > 0 ? (
                            pillState.selections.type.map((value) => (
                              <span
                                key={`type-pill-${value}`}
                                className="pill inline-flex items-center gap-2"
                              >
                                {value}
                                <button
                                  type="button"
                                  className="text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                                  onClick={() =>
                                    toggleMultiSelection("type", value)
                                  }
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[color:var(--muted)]">
                              {t("exerciseEditor.noTypeSelected")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="stack-sm">
                        <label className="field-label">
                          {t("exerciseEditor.musclesLabel")}
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            className="field-input flex items-center justify-between"
                            ref={(node) => {
                              dropdownTriggerRefs.current.muscles = node;
                            }}
                            onClick={() => toggleDropdown("muscles")}
                          >
                            <span>
                              {pillState.selections.muscles.length > 0
                                ? `${pillState.selections.muscles.length} ${t(pillState.selections.muscles.length === 1 ? "exerciseEditor.selectedSingular" : "exerciseEditor.selectedPlural")}`
                                : t("exerciseEditor.selectPlaceholder")}
                            </span>
                            <span aria-hidden="true">▾</span>
                          </button>
                        </div>
                        {pillDropdownOpen === "muscles" && pillDropdownStyle
                          ? createPortal(
                              <div
                                ref={dropdownMenuRef}
                                className={DROPDOWN_MENU_LAYER_CLASS}
                                style={{
                                  position: "absolute",
                                  top: pillDropdownStyle.top,
                                  left: pillDropdownStyle.left,
                                  width: pillDropdownStyle.width,
                                }}
                              >
                                <div className={DROPDOWN_MENU_PANEL_CLASS}>
                                  <div className="sticky top-0 z-10 bg-[color:var(--bg-2)] pb-2">
                                    <input
                                      className="field-input"
                                      placeholder={t("exerciseEditor.searchPlaceholder")}
                                      value={pillSearch.muscles}
                                      onChange={(event) =>
                                        setPillSearch((prev) => ({
                                          ...prev,
                                          muscles: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div
                                    className="space-y-1 overflow-y-auto"
                                    style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
                                  >
                                    {filteredMuscleOptions.map((option) => {
                                      const checked = pillState.selections.muscles.some(
                                        (value) =>
                                          normalizeKey(value) === normalizeKey(option),
                                      );
                                      return (
                                        <label
                                          key={`muscle-option-${option}`}
                                          className="flex min-h-[36px] items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              toggleMultiSelection("muscles", option)
                                            }
                                          />
                                          <span>{option}</span>
                                        </label>
                                      );
                                    })}
                                    {normalizeLabel(pillSearch.muscles) &&
                                    !optionExists(
                                      pillState.options.muscles,
                                      pillSearch.muscles,
                                    ) ? (
                                      <button
                                        type="button"
                                        className="chip w-full justify-start"
                                        onClick={() => addCustomOption("muscles")}
                                      >
                                        {`${t("exerciseEditor.add")} '${normalizeLabel(pillSearch.muscles)}'`}
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>,
                              document.body,
                            )
                          : null}
                        <div className="flex flex-wrap gap-2">
                          {pillState.selections.muscles.length > 0 ? (
                            pillState.selections.muscles.map((value) => (
                              <span
                                key={`muscle-pill-${value}`}
                                className="pill inline-flex items-center gap-2"
                              >
                                {value}
                                <button
                                  type="button"
                                  className="text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                                  onClick={() =>
                                    toggleMultiSelection("muscles", value)
                                  }
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[color:var(--muted)]">
                              {t("exerciseEditor.noMuscleSelected")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="stack-sm">
                        <label className="field-label">
                          {t("exerciseEditor.themesLabel")}
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            className="field-input flex items-center justify-between"
                            ref={(node) => {
                              dropdownTriggerRefs.current.themes = node;
                            }}
                            onClick={() => toggleDropdown("themes")}
                          >
                            <span>
                              {pillState.selections.themes.length > 0
                                ? `${pillState.selections.themes.length} ${t(pillState.selections.themes.length === 1 ? "exerciseEditor.selectedSingular" : "exerciseEditor.selectedPlural")}`
                                : t("exerciseEditor.selectPlaceholder")}
                            </span>
                            <span aria-hidden="true">▾</span>
                          </button>
                        </div>
                        {pillDropdownOpen === "themes" && pillDropdownStyle
                          ? createPortal(
                              <div
                                ref={dropdownMenuRef}
                                className={DROPDOWN_MENU_LAYER_CLASS}
                                style={{
                                  position: "absolute",
                                  top: pillDropdownStyle.top,
                                  left: pillDropdownStyle.left,
                                  width: pillDropdownStyle.width,
                                }}
                              >
                                <div className={DROPDOWN_MENU_PANEL_CLASS}>
                                  <div className="sticky top-0 z-10 bg-[color:var(--bg-2)] pb-2">
                                    <input
                                      className="field-input"
                                      placeholder={t("exerciseEditor.searchPlaceholder")}
                                      value={pillSearch.themes}
                                      onChange={(event) =>
                                        setPillSearch((prev) => ({
                                          ...prev,
                                          themes: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div
                                    className="space-y-1 overflow-y-auto"
                                    style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
                                  >
                                    {filteredThemeOptions.map((option) => {
                                      const checked = pillState.selections.themes.some(
                                        (value) =>
                                          normalizeKey(value) === normalizeKey(option),
                                      );
                                      return (
                                        <label
                                          key={`theme-option-${option}`}
                                          className="flex min-h-[36px] items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              toggleMultiSelection("themes", option)
                                            }
                                          />
                                          <span>{option}</span>
                                        </label>
                                      );
                                    })}
                                    {normalizeLabel(pillSearch.themes) &&
                                    !optionExists(
                                      pillState.options.themes,
                                      pillSearch.themes,
                                    ) ? (
                                      <button
                                        type="button"
                                        className="chip w-full justify-start"
                                        onClick={() => addCustomOption("themes")}
                                      >
                                        {`${t("exerciseEditor.add")} '${normalizeLabel(pillSearch.themes)}'`}
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>,
                              document.body,
                            )
                          : null}
                        <div className="flex flex-wrap gap-2">
                          {pillState.selections.themes.length > 0 ? (
                            pillState.selections.themes.map((value) => (
                              <span
                                key={`theme-pill-${value}`}
                                className="pill inline-flex items-center gap-2"
                              >
                                {value}
                                <button
                                  type="button"
                                  className="text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                                  onClick={() =>
                                    toggleMultiSelection("themes", value)
                                  }
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[color:var(--muted)]">
                              {t("exerciseEditor.noThemeSelected")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-4 shadow-lg">
                  <div className="stack-md">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold">
                        {t("exerciseEditor.mainImageLabel")}
                      </h3>
                      <p className="text-sm text-[color:var(--muted)]">
                        {t("exerciseEditor.mainImageDesc")}
                      </p>
                    </div>
                    <div className="stack-sm">
                      <input
                        className="field-input"
                        placeholder={t("exerciseEditor.imageUrlPlaceholder")}
                        value={overrideDoc.doc.heroImage?.url ?? ""}
                        onChange={(event) =>
                          handleHeroUrlChange(event.target.value)
                        }
                      />
                      <input
                        className="field-input"
                        placeholder={t("exerciseEditor.altTextPlaceholder")}
                        value={overrideDoc.doc.heroImage?.alt ?? ""}
                        onChange={(event) =>
                          handleHeroAltChange(event.target.value)
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="chip"
                          onClick={handleHeroPreview}
                        >
                          {t("exerciseEditor.preview")}
                        </button>
                        <button
                          type="button"
                          className="chip"
                          onClick={handleHeroRemove}
                        >
                          {t("exerciseEditor.deleteImage")}
                        </button>
                      </div>
                      {heroPreviewUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={heroPreviewUrl}
                            alt={t("exerciseEditor.preview")}
                            className="w-full h-auto rounded-2xl ring-1 ring-white/10"
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-4 shadow-lg">
                  <div className="stack-md">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold">
                        {t("exerciseEditor.contentCardTitle")}
                      </h3>
                      <p className="text-sm text-[color:var(--muted)]">
                        {t("exerciseEditor.contentCardDesc")}
                      </p>
                    </div>
                    <div className="stack-md">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                          {t("exerciseEditor.sectionsLabel")}
                        </h3>
                        <button
                          type="button"
                          className="chip"
                          onClick={handleAddSection}
                        >
                          {t("exerciseEditor.addSection")}
                        </button>
                      </div>
                      {overrideDoc.doc.sections.map((section, sectionIndex) => (
                        <div
                          key={section.id}
                          className="stack-md"
                          onFocusCapture={() => setActiveSectionId(section.id)}
                          onMouseDown={() => setActiveSectionId(section.id)}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <input
                              ref={(node) => {
                                sectionTitleRefs.current[section.id] = node;
                              }}
                              className="field-input flex-1"
                              value={section.title}
                              placeholder={t("exerciseEditor.sectionTitlePlaceholder")}
                              onChange={(event) =>
                                updateSection(section.id, (current) => ({
                                  ...current,
                                  title: event.target.value,
                                }))
                              }
                            />
                            <div className="relative">
                              <button
                                type="button"
                                className="chip"
                                onClick={() => {
                                  setActiveSectionId(section.id);
                                  setSectionMenuOpenId((open) =>
                                    open === section.id ? null : section.id,
                                  );
                                }}
                              >
                                ...
                              </button>
                              {sectionMenuOpenId === section.id ? (
                                <div
                                  className={`absolute right-0 ${DROPDOWN_MENU_LAYER_CLASS} mt-2 w-48 ${DROPDOWN_MENU_PANEL_CLASS}`}
                                >
                                  <button
                                    type="button"
                                    className="chip w-full justify-start"
                                    onClick={() => {
                                      handleFocusSectionTitle(section.id);
                                      setSectionMenuOpenId(null);
                                    }}
                                  >
                                    {t("exerciseEditor.rename")}
                                  </button>
                                  <div className="mt-2 border-t border-white/10 pt-2">
                                    <span className="block px-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                      {t("exerciseEditor.addBlock")}
                                    </span>
                                    <button
                                      type="button"
                                      className="chip w-full justify-start"
                                      onClick={() => {
                                        setActiveSectionId(section.id);
                                        handleAddBlock(section.id, "markdown");
                                        setSectionMenuOpenId(null);
                                      }}
                                    >
                                      {t("exerciseEditor.textBlock")}
                                    </button>
                                    <button
                                      type="button"
                                      className="chip w-full justify-start"
                                      onClick={() => {
                                        setActiveSectionId(section.id);
                                        handleAddBlock(section.id, "bullets");
                                        setSectionMenuOpenId(null);
                                      }}
                                    >
                                      {t("exerciseEditor.bulletsList")}
                                    </button>
                                    <button
                                      type="button"
                                      className="chip w-full justify-start"
                                      onClick={() => {
                                        setActiveSectionId(section.id);
                                        handlePhotoUploadRequest(section.id);
                                        setSectionMenuOpenId(null);
                                      }}
                                    >
                                      {t("exerciseEditor.photoBlock")}
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    className="chip w-full justify-start"
                                    disabled={sectionIndex === 0}
                                    onClick={() => {
                                      handleMoveSection(section.id, -1);
                                      setSectionMenuOpenId(null);
                                    }}
                                  >
                                    {t("exerciseEditor.moveUp")}
                                  </button>
                                  <button
                                    type="button"
                                    className="chip w-full justify-start"
                                    disabled={
                                      sectionIndex === overrideDoc.doc.sections.length - 1
                                    }
                                    onClick={() => {
                                      handleMoveSection(section.id, 1);
                                      setSectionMenuOpenId(null);
                                    }}
                                  >
                                    {t("exerciseEditor.moveDown")}
                                  </button>
                                  <button
                                    type="button"
                                    className="chip w-full justify-start"
                                    onClick={() => {
                                      handleRemoveSection(section.id);
                                      setSectionMenuOpenId(null);
                                    }}
                                  >
                                    {t("exerciseEditor.deleteSection")}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          {section.blocks.length === 0 ? (
                            <p className="text-xs text-[color:var(--muted)]">
                              {t("exerciseEditor.noBlocks")}
                            </p>
                          ) : null}
                          <div className="stack-sm">
                            {section.blocks.map((block, blockIndex) => {
                              const blockKey = `${section.id}-${blockIndex}`;
                              const blockLabel =
                                block.type === "markdown"
                                  ? t("exerciseEditor.textBlock")
                                  : block.type === "bullets"
                                    ? t("exerciseEditor.bulletsList")
                                    : block.mediaType === "image"
                                      ? t("exerciseEditor.photoBlock")
                                      : block.mediaType === "video"
                                        ? t("exerciseEditor.video")
                                        : t("exerciseEditor.linkType");
                              const hasPhoto =
                                block.type === "media" &&
                                block.mediaType === "image" &&
                                (block.mediaId || block.url);

                              return (
                                <div
                                  key={blockKey}
                                  ref={(node) => {
                                    blockContainerRefs.current[blockKey] = node;
                                  }}
                                  className={`stack-sm rounded-2xl border border-white/10 p-3 transition ${
                                    highlightBlockKey === blockKey
                                      ? "ring-2 ring-white/40 bg-white/5"
                                      : ""
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                      {blockLabel}
                                    </span>
                                    <div className="relative">
                                      <button
                                        type="button"
                                        className="chip"
                                        onClick={() =>
                                          setBlockMenuOpenKey((open) =>
                                            open === blockKey ? null : blockKey,
                                          )
                                        }
                                      >
                                        ...
                                      </button>
                                      {blockMenuOpenKey === blockKey ? (
                                        <div
                                          className={`absolute right-0 ${DROPDOWN_MENU_LAYER_CLASS} mt-2 w-44 ${DROPDOWN_MENU_PANEL_CLASS}`}
                                        >
                                          <button
                                            type="button"
                                            className="chip w-full justify-start"
                                            onClick={() => {
                                              handleFocusBlock(blockKey);
                                              setBlockMenuOpenKey(null);
                                            }}
                                          >
                                            {t("exerciseEditor.edit")}
                                          </button>
                                          <button
                                            type="button"
                                            className="chip w-full justify-start"
                                            disabled={blockIndex === 0}
                                            onClick={() => {
                                              handleMoveBlock(section.id, blockIndex, -1);
                                              setBlockMenuOpenKey(null);
                                            }}
                                          >
                                            {t("exerciseEditor.moveUp")}
                                          </button>
                                          <button
                                            type="button"
                                            className="chip w-full justify-start"
                                            disabled={blockIndex === section.blocks.length - 1}
                                            onClick={() => {
                                              handleMoveBlock(section.id, blockIndex, 1);
                                              setBlockMenuOpenKey(null);
                                            }}
                                          >
                                            {t("exerciseEditor.moveDown")}
                                          </button>
                                          <button
                                            type="button"
                                            className="chip w-full justify-start"
                                            onClick={() => {
                                              handleRemoveBlock(section.id, blockIndex);
                                              setBlockMenuOpenKey(null);
                                            }}
                                          >
                                            {t("exerciseEditor.delete")}
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                  {block.type === "bullets" ? (
                                    <p className="text-xs text-[color:var(--muted)]">
                                      {t("exerciseEditor.bulletHint")}
                                    </p>
                                  ) : null}

                                  {block.type === "markdown" ? (
                                    <textarea
                                      ref={(node) => {
                                        blockFieldRefs.current[blockKey] = node;
                                      }}
                                      className="field-textarea"
                                      value={block.content}
                                      onChange={(event) =>
                                        updateSection(section.id, (current) => ({
                                          ...current,
                                          blocks: current.blocks.map((item, idx) =>
                                            idx === blockIndex && item.type === "markdown"
                                              ? { ...item, content: event.target.value }
                                              : item,
                                          ),
                                        }))
                                      }
                                    />
                                  ) : null}

                                  {block.type === "bullets" ? (
                                    <div className="stack-sm">
                                      {block.items.map((item, itemIndex) => (
                                        <div
                                          key={`${section.id}-${blockIndex}-${itemIndex}`}
                                          className="flex items-center gap-2"
                                        >
                                          <input
                                            ref={(node) => {
                                              if (itemIndex === 0) {
                                                blockFieldRefs.current[blockKey] = node;
                                              }
                                            }}
                                            className="field-input"
                                            value={item}
                                            onChange={(event) =>
                                              updateSection(section.id, (current) => ({
                                                ...current,
                                                blocks: current.blocks.map((entry, idx) =>
                                                  idx === blockIndex && entry.type === "bullets"
                                                    ? {
                                                        ...entry,
                                                        items: entry.items.map((value, pos) =>
                                                          pos === itemIndex
                                                            ? event.target.value
                                                            : value,
                                                        ),
                                                      }
                                                    : entry,
                                                ),
                                              }))
                                            }
                                          />
                                          <button
                                            type="button"
                                            className="chip"
                                            onClick={() =>
                                              updateSection(section.id, (current) => ({
                                                ...current,
                                                blocks: current.blocks.map((entry, idx) =>
                                                  idx === blockIndex && entry.type === "bullets"
                                                    ? {
                                                        ...entry,
                                                        items: entry.items.filter(
                                                          (_, pos) => pos !== itemIndex,
                                                        ),
                                                      }
                                                    : entry,
                                                ),
                                              }))
                                            }
                                          >
                                            {t("exerciseEditor.delete")}
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        className="chip"
                                        onClick={() =>
                                          updateSection(section.id, (current) => ({
                                            ...current,
                                            blocks: current.blocks.map((entry, idx) =>
                                              idx === blockIndex && entry.type === "bullets"
                                                ? { ...entry, items: [...entry.items, ""] }
                                                : entry,
                                            ),
                                          }))
                                        }
                                      >
                                        {t("exerciseEditor.addBullet")}
                                      </button>
                                    </div>
                                  ) : null}

                                  {block.type === "media" ? (
                                    <div className="stack-sm">
                                      {block.mediaType === "image" ? (
                                        <>
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-xs text-[color:var(--muted)]">
                                              {t("exerciseEditor.photoBlock")}
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                              {hasPhoto ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    className="chip"
                                                    onClick={() =>
                                                      handlePhotoUploadRequest(
                                                        section.id,
                                                        blockIndex,
                                                      )
                                                    }
                                                  >
                                                    {t("exerciseEditor.replace")}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="chip"
                                                    onClick={() =>
                                                      handleClearPhoto(section.id, blockIndex)
                                                    }
                                                  >
                                                    {t("exerciseEditor.delete")}
                                                  </button>
                                                </>
                                              ) : (
                                                <button
                                                  type="button"
                                                  className="chip"
                                                  onClick={() =>
                                                    handlePhotoUploadRequest(
                                                      section.id,
                                                      blockIndex,
                                                    )
                                                  }
                                                >
                                                  {t("exerciseEditor.addPhoto")}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          {block.mediaId ? (
                                            <p className="text-xs text-[color:var(--muted)]">
                                              mediaId: {block.mediaId}
                                            </p>
                                          ) : block.url ? (
                                            <p className="text-xs text-[color:var(--muted)]">
                                              {t("exerciseEditor.inheritedUrl")} {block.url}
                                            </p>
                                          ) : (
                                            <p className="text-xs text-[color:var(--muted)]">
                                              {t("exerciseEditor.noPhoto")}
                                            </p>
                                          )}
                                          {hasPhoto
                                            ? (() => {
                                                const directUrl = block.url?.trim();
                                                const resolvedUrl = block.mediaId
                                                  ? mediaUrlMap[block.mediaId] ??
                                                    mediaUrlCache.get(block.mediaId)
                                                  : undefined;
                                                const previewUrl =
                                                  directUrl && directUrl.length > 0
                                                    ? directUrl
                                                    : resolvedUrl ?? null;
                                                const infoLine = block.mediaId
                                                  ? formatMediaInfo(
                                                      mediaInfoMap[block.mediaId],
                                                    )
                                                  : null;
                                                const resolveState = block.mediaId
                                                  ? mediaResolveState[block.mediaId]
                                                  : undefined;
                                                const resolveError = block.mediaId
                                                  ? mediaResolveError[block.mediaId]
                                                  : null;
                                                return (
                                                  <PhotoPreview
                                                    previewUrl={previewUrl}
                                                    alt={
                                                      block.caption ||
                                                      `${displayTitle} — ${(merged.frontmatter.muscles ?? []).slice(0, 3).join(", ")}`
                                                    }
                                                    infoLine={infoLine}
                                                    isResolving={resolveState === "loading"}
                                                    hasError={resolveState === "error"}
                                                    errorDetail={resolveError}
                                                    onRetry={() => {
                                                      if (!block.url?.trim() && block.mediaId) {
                                                        void resolveMediaAsset(block.mediaId, {
                                                          force: true,
                                                        });
                                                      }
                                                    }}
                                                  />
                                                );
                                              })()
                                            : null}
                                          <label className="field-label">
                                            {t("exerciseEditor.caption")}
                                          </label>
                                          <input
                                            ref={(node) => {
                                              blockFieldRefs.current[blockKey] = node;
                                            }}
                                            className="field-input"
                                            value={block.caption ?? ""}
                                            onChange={(event) =>
                                              updateSection(section.id, (current) => ({
                                                ...current,
                                                blocks: current.blocks.map((entry, idx) =>
                                                  idx === blockIndex && entry.type === "media"
                                                    ? { ...entry, caption: event.target.value }
                                                    : entry,
                                                ),
                                              }))
                                            }
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <label className="field-label">
                                            {t("exerciseEditor.typeLabel")}
                                          </label>
                                          <select
                                            className="field-input"
                                            value={block.mediaType}
                                            onChange={(event) =>
                                              updateSection(section.id, (current) => ({
                                                ...current,
                                                blocks: current.blocks.map((entry, idx) =>
                                                  idx === blockIndex &&
                                                  entry.type === "media" &&
                                                  entry.mediaType !== "image"
                                                    ? {
                                                        ...entry,
                                                        mediaType: event.target.value as
                                                          | "video"
                                                          | "link",
                                                      }
                                                    : entry,
                                                ),
                                              }))
                                            }
                                          >
                                            <option value="video">{t("exerciseEditor.video")}</option>
                                            <option value="link">{t("exerciseEditor.linkType")}</option>
                                          </select>
                                          <label className="field-label">URL</label>
                                          <input
                                            ref={(node) => {
                                              blockFieldRefs.current[blockKey] = node;
                                            }}
                                            className="field-input"
                                            value={block.url}
                                            onChange={(event) =>
                                              updateSection(section.id, (current) => ({
                                                ...current,
                                                blocks: current.blocks.map((entry, idx) =>
                                                  idx === blockIndex &&
                                                  entry.type === "media" &&
                                                  entry.mediaType !== "image"
                                                    ? { ...entry, url: event.target.value }
                                                    : entry,
                                                ),
                                              }))
                                            }
                                          />
                                          <label className="field-label">
                                            {t("exerciseEditor.captionOptional")}
                                          </label>
                                          <input
                                            className="field-input"
                                            value={block.caption ?? ""}
                                            onChange={(event) =>
                                              updateSection(section.id, (current) => ({
                                                ...current,
                                                blocks: current.blocks.map((entry, idx) =>
                                                  idx === blockIndex &&
                                                  entry.type === "media" &&
                                                  entry.mediaType !== "image"
                                                    ? { ...entry, caption: event.target.value }
                                                    : entry,
                                                ),
                                              }))
                                            }
                                          />
                                        </>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
              </div>
            ) : (
              <p className="text-xs text-[color:var(--muted)]">
                {t("exerciseEditor.loading")}
              </p>
            )}
          </div>
          <div className="sticky bottom-0 mt-4 border-t border-white/10 bg-[color:var(--surface)] pt-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    <span>{t("exerciseEditor.activeSectionLabel")}</span>
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      {t("exerciseEditor.activeLabel")}
                    </span>
                  </span>
                  <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-100">
                    {t("exerciseEditor.addingIn")}{" "}
                    {activeSection
                      ? activeSection.title || t("exerciseEditor.untitledSection")
                      : t("exerciseEditor.noSection")}
                  </span>
                  <select
                    className="field-input"
                    value={activeSection?.id ?? ""}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue === "__add_section__") {
                        handleAddSection();
                        return;
                      }
                      setActiveSectionId(nextValue);
                    }}
                    disabled={!overrideDoc}
                  >
                    <option value="">{t("exerciseEditor.selectSection")}</option>
                    {overrideDoc?.doc.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title || t("exerciseEditor.untitledSection")}
                      </option>
                    ))}
                    <option value="__add_section__">
                      {t("exerciseEditor.addSection")}
                    </option>
                  </select>
                </div>
                <div className="relative">
                  <button
                    ref={addBlockButtonRef}
                    type="button"
                    className="chip"
                    onClick={() => setAddBlockMenuOpen((open) => !open)}
                    disabled={!overrideDoc || overrideDoc.doc.sections.length === 0}
                  >
                    {t("exerciseEditor.addBlock")}…
                  </button>
                  {addBlockMenuOpen ? (
                    <div
                      ref={addBlockMenuRef}
                      className="absolute bottom-full left-0 z-10 mb-2 w-44 rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-2 shadow-lg"
                    >
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => {
                          handleAddFromMenu("markdown");
                          setAddBlockMenuOpen(false);
                        }}
                      >
                        {t("exerciseEditor.textBlock")}
                      </button>
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => {
                          handleAddFromMenu("bullets");
                          setAddBlockMenuOpen(false);
                        }}
                      >
                        {t("exerciseEditor.bulletsList")}
                      </button>
                      <button
                        type="button"
                        className="chip w-full justify-start"
                        onClick={() => {
                          handleAddFromMenu("photo");
                          setAddBlockMenuOpen(false);
                        }}
                      >
                        {t("exerciseEditor.photoBlock")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="primary-button primary-button--wide"
                  onClick={handleSaveOverride}
                  disabled={!isDirty || isSavingOverride}
                >
                  <span className="inline-flex items-center gap-2">
                    {isDirty ? (
                      <span
                        className="inline-flex h-2 w-2 rounded-full bg-amber-300"
                        aria-hidden="true"
                      />
                    ) : null}
                    {t("exerciseEditor.save")}
                  </span>
                </button>
                <button
                  type="button"
                  className="chip border border-white/20 bg-white/5 hover:bg-white/10"
                  onClick={handleCloseOverride}
                >
                  {t("exerciseEditor.close")}
                </button>
                <button
                  type="button"
                  className={`chip ${
                    isDirty
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "chip-ghost"
                  }`}
                  onClick={handleDiscardOverride}
                  disabled={!isDirty}
                >
                  {isDirty
                    ? `⟲ ${t("exerciseEditor.discardChanges")}`
                    : t("exerciseEditor.discardChanges")}
                </button>
              </div>
              {!isDirty && !isSavingOverride ? (
                <p className="text-xs text-[color:var(--muted)]">
                  {t("exerciseEditor.noChangesYet")}
                </p>
              ) : null}
              {isDirty && saveMeta.status === "draft" ? (
                <p className="text-xs text-[color:var(--muted)]">
                  {saveMeta.missing.length > 0
                    ? `${t("exerciseEditor.missingFields")} ${saveMeta.missing
                        .map(
                          (f) =>
                            ({
                              titre: t("exerciseEditor.titleLabel"),
                              tags: "Tags",
                              muscles: t("exerciseEditor.musclesLabel"),
                              thèmes: t("exerciseEditor.themesLabel"),
                            } as Record<string, string>)[f] ?? f,
                        )
                        .join(", ")}. `
                    : ""}
                  {t("exerciseEditor.draftNote")}
                </p>
              ) : null}
            </div>
            {mediaStatus ? (
              <p className="text-xs text-[color:var(--muted)]">{mediaStatus}</p>
            ) : null}
            {submitStatus ? (
              <p className="text-xs text-[color:var(--muted)]">{submitStatus}</p>
            ) : null}
          </div>
          {blockToast ? (
            <div
              className="fixed left-1/2 z-[90] w-[min(520px,calc(100vw-32px))] -translate-x-1/2"
              style={{
                bottom: "calc(16px + env(safe-area-inset-bottom) + 72px)",
              }}
              role="status"
              aria-live="polite"
            >
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-3 text-sm text-emerald-100 shadow-lg backdrop-blur transition-all duration-200 ${
                  blockToastVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
              >
                <span>{blockToast.message}</span>
                <button
                  type="button"
                  className="text-emerald-100/70 hover:text-emerald-50"
                  aria-label={t("exerciseEditor.close")}
                  onClick={dismissBlockToast}
                >
                  ×
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {confirmCloseOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>{t("exerciseEditor.changesPending")}</h2>
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button primary-button--wide"
                onClick={() => setConfirmCloseOpen(false)}
              >
                {t("header.back")}
              </button>
              <button
                type="button"
                className="chip"
                onClick={handleCloseWithoutSave}
              >
                {t("exerciseEditor.closeWithout")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {deleteLiveOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>{t("exerciseEditor.deleteSaved")}</h2>
            <p className="text-sm text-[color:var(--muted)]">
              {t("exerciseEditor.deleteWarning")}
            </p>
            <div className="stack-sm">
              <p className="text-xs text-[color:var(--muted)]">
                Slug:{" "}
                <span className="font-semibold text-[color:var(--ink)]">
                  {slug}
                </span>
                {" • "}
                Locale:{" "}
                <span className="font-semibold text-[color:var(--ink)]">
                  {locale}
                </span>
              </p>
              <label className="field-label">{t("teacherMode.pinHeading")}</label>
              <input
                className="field-input"
                type="password"
                value={teacherPin}
                onChange={(event) => setTeacherPin(event.target.value)}
                placeholder={t("teacherMode.pinRequired")}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="chip"
                onClick={() => setDeleteLiveOpen(false)}
                disabled={isDeletingLive}
              >
                {t("teacherMode.cancel")}
              </button>
              <button
                type="button"
                className="primary-button primary-button--wide bg-red-500 text-white hover:bg-red-600"
                onClick={handleDeleteLive}
                disabled={isDeletingLive || !teacherPin}
              >
                {isDeletingLive
                  ? t("exerciseEditor.deleting")
                  : t("exerciseEditor.deleteSaved")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
