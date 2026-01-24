"use client";

import { useMemo } from "react";

type ChipsProps = {
  items: string[];
  activeItems?: string[];
  onToggle?: (item: string) => void;
  onClear?: () => void;
  label?: string;
};

export function Chips({ items, activeItems = [], onToggle, onClear, label }: ChipsProps) {
  const activeSet = useMemo(() => new Set(activeItems), [activeItems]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="chip-group">
      {label ? <span className="chip-label">{label}</span> : null}
      <div className="chip-row">
        {items.map((item) => {
          const isActive = activeSet.has(item);
          const className = `chip${isActive ? " is-active" : ""}`;

          return (
            <button
              key={item}
              type="button"
              className={className}
              onClick={onToggle ? () => onToggle(item) : undefined}
            >
              {item}
            </button>
          );
        })}
        {onClear ? (
          <button type="button" className="chip chip-clear" onClick={onClear}>
            Effacer
          </button>
        ) : null}
      </div>
    </div>
  );
}
