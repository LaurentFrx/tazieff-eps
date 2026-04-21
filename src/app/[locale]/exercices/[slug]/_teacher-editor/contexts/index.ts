// Phase B.0 — barrel export for teacher override editor contexts.
// Consumers: ExerciseLiveDetail.tsx (for providers), future extracted editor (for hooks).

export {
  OverrideDocProvider,
  useOverrideDocContext,
  type OverrideDocContextValue,
  type OverrideToast,
  type SaveMeta,
} from "./OverrideDocContext";

export {
  OverrideMediaProvider,
  useOverrideMediaContext,
  type OverrideMediaContextValue,
  type MediaInfo,
  type MediaResolveStatus,
  type UploadTarget,
} from "./OverrideMediaContext";

export {
  OverridePillsProvider,
  useOverridePillsContext,
  type OverridePillsContextValue,
  type PillCategory,
  type PillSearchState,
  type PillCustomOptionsState,
  type PillDropdownStyle,
  type PillSelections,
  type PillOptions,
  type PillState,
} from "./OverridePillsContext";

export {
  OverrideUIProvider,
  useOverrideUIContext,
  type OverrideUIContextValue,
} from "./OverrideUIContext";
