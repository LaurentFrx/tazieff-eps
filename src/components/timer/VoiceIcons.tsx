/** Shared voice-toggle icons for all timers — "talking face" profile with sound arcs */

export const VoiceOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Head profile */}
    <path d="M8 3C4 3 1 7 1 12C1 17 4 21 8 21"/>
    {/* Nose-mouth */}
    <path d="M8 9L10.5 11L8 13"/>
    {/* Sound arcs */}
    <path d="M13 8C15.5 10.5 15.5 13.5 13 16"/>
    <path d="M16 5.5C19.5 9 19.5 15 16 18.5"/>
    <path d="M19 3C23 7.5 23 16.5 19 21"/>
  </svg>
);

export const VoiceOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Head profile */}
    <path d="M8 3C4 3 1 7 1 12C1 17 4 21 8 21"/>
    {/* Nose-mouth */}
    <path d="M8 9L10.5 11L8 13"/>
    {/* Sound arcs */}
    <path d="M13 8C15.5 10.5 15.5 13.5 13 16"/>
    <path d="M16 5.5C19.5 9 19.5 15 16 18.5"/>
    <path d="M19 3C23 7.5 23 16.5 19 21"/>
    {/* Strike-through */}
    <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2.5"/>
  </svg>
);
