"use client";
import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Swipe-down-to-close gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 80) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100]"
        style={{
          background: "rgba(0,0,0,0.5)",
          animation: "bs-fade-in 0.25s ease both",
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col"
        style={{
          maxHeight: "70vh",
          background: "#0F0F1C",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          animation: "bs-slide-up 0.35s cubic-bezier(0.22,1,0.36,1) both",
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-5 pb-3 flex items-center justify-between">
            <h3
              className="text-base font-bold text-white uppercase tracking-wider"
              style={{ fontFamily: "var(--font-bebas), sans-serif" }}
            >
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="tap-feedback flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/60"
              aria-label="Fermer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes bs-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bs-slide-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>,
    document.body,
  );
}
