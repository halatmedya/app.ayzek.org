// Shared animation timing configuration used across pages (Home, Agenda, etc.)
// Adjust here to globally tune animation pacing.
export const ANIM = {
  typingInterval: 120,          // ms per character for typing effects
  ease: 'easeOut' as const,
  durShort: 0.9,
  durMedium: 1.05,
  durLong: 1.15,
};
