/** Shared voice-toggle icons for all timers — "talking head" with sound arcs */

export const VoiceOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Head + chin */}
    <path d="M12 1C9 1 7 3.5 7 6c0 1.5.5 3 2 4l-1 2.5c-.2.5.1 1 .6 1h6.8c.5 0 .8-.5.6-1L15 10c1.5-1 2-2.5 2-4 0-2.5-2-5-5-5z"/>
    <path d="M9 13.5v1c0 1.7 1.3 3 3 3s3-1.3 3-3v-1"/>
    {/* Sound arcs */}
    <path d="M17 8a5.5 5.5 0 0 1 0 5"/>
    <path d="M20 6.5a9 9 0 0 1 0 9"/>
  </svg>
);

export const VoiceOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Head + chin */}
    <path d="M12 1C9 1 7 3.5 7 6c0 1.5.5 3 2 4l-1 2.5c-.2.5.1 1 .6 1h6.8c.5 0 .8-.5.6-1L15 10c1.5-1 2-2.5 2-4 0-2.5-2-5-5-5z"/>
    <path d="M9 13.5v1c0 1.7 1.3 3 3 3s3-1.3 3-3v-1"/>
    {/* Sound arcs */}
    <path d="M17 8a5.5 5.5 0 0 1 0 5"/>
    <path d="M20 6.5a9 9 0 0 1 0 9"/>
    {/* Strike-through */}
    <line x1="3" y1="21" x2="21" y2="3" strokeWidth="2.5"/>
  </svg>
);
