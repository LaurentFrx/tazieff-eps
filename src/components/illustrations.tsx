/* ── Shared SVG illustrations for section heroes + homepage ──────────────── */

export function IlluDumbbell() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="absolute right-2 bottom-2 opacity-20">
      <g stroke="white" strokeWidth="3" strokeLinecap="round">
        <rect x="10" y="35" width="12" height="30" rx="3" fill="white" fillOpacity="0.15" />
        <rect x="78" y="35" width="12" height="30" rx="3" fill="white" fillOpacity="0.15" />
        <rect x="2" y="40" width="10" height="20" rx="2" fill="white" fillOpacity="0.1" />
        <rect x="88" y="40" width="10" height="20" rx="2" fill="white" fillOpacity="0.1" />
        <line x1="22" y1="50" x2="78" y2="50" strokeWidth="4" />
        <circle cx="50" cy="28" r="10" fill="white" fillOpacity="0.1" />
        <line x1="50" y1="38" x2="50" y2="60" strokeWidth="3" />
        <line x1="50" y1="60" x2="38" y2="78" strokeWidth="2.5" />
        <line x1="50" y1="60" x2="62" y2="78" strokeWidth="2.5" />
        <line x1="50" y1="48" x2="35" y2="42" strokeWidth="2.5" />
        <line x1="50" y1="48" x2="65" y2="42" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

export function IlluClipboard() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="absolute right-2 bottom-2 opacity-20">
      <g stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <rect x="15" y="10" width="50" height="60" rx="6" fill="white" fillOpacity="0.1" />
        <rect x="28" y="5" width="24" height="12" rx="4" fill="white" fillOpacity="0.15" />
        <line x1="25" y1="30" x2="55" y2="30" />
        <line x1="25" y1="40" x2="50" y2="40" />
        <line x1="25" y1="50" x2="45" y2="50" />
        <circle cx="55" cy="55" r="12" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2" />
        <path d="M52 55l3 3 5-6" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function IlluBook() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="absolute right-2 bottom-2 opacity-20">
      <g stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <path d="M40 15C32 10 20 10 10 15v50c10-5 22-5 30 0 8-5 20-5 30 0V15C60 10 48 10 40 15z" fill="white" fillOpacity="0.1" />
        <line x1="40" y1="15" x2="40" y2="65" />
        <line x1="20" y1="28" x2="35" y2="28" />
        <line x1="20" y1="36" x2="33" y2="36" />
        <line x1="20" y1="44" x2="30" y2="44" />
        <line x1="45" y1="28" x2="60" y2="28" />
        <line x1="45" y1="36" x2="58" y2="36" />
        <circle cx="60" cy="20" r="8" fill="white" fillOpacity="0.15" />
        <path d="M57 20l2 2 4-4" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export function IlluTrophy() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="absolute right-2 bottom-2 opacity-20">
      <g stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <path d="M35 25h30v25c0 12-7 20-15 20s-15-8-15-20V25z" fill="white" fillOpacity="0.15" />
        <path d="M35 35H20c0 10 8 15 15 15" />
        <path d="M65 35h15c0 10-8 15-15 15" />
        <line x1="50" y1="70" x2="50" y2="80" strokeWidth="3" />
        <line x1="38" y1="80" x2="62" y2="80" strokeWidth="3" />
        <polygon points="50,15 53,22 60,22 54,26 56,33 50,29 44,33 46,26 40,22 47,22" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export function IlluDashboard() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" className="absolute right-2 bottom-2 opacity-20">
      <g stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <rect x="10" y="15" width="70" height="55" rx="8" fill="white" fillOpacity="0.1" />
        <line x1="10" y1="30" x2="80" y2="30" />
        <rect x="18" y="38" width="18" height="24" rx="3" fill="white" fillOpacity="0.15" />
        <rect x="42" y="48" width="12" height="14" rx="2" fill="white" fillOpacity="0.1" />
        <rect x="60" y="42" width="12" height="20" rx="2" fill="white" fillOpacity="0.12" />
        <circle cx="22" cy="22" r="3" fill="white" fillOpacity="0.3" />
        <circle cx="30" cy="22" r="3" fill="white" fillOpacity="0.2" />
        <circle cx="38" cy="22" r="3" fill="white" fillOpacity="0.15" />
      </g>
    </svg>
  );
}
