/**
 * Brand colors — V2 with phase-themed backgrounds.
 *
 * Phase B / C  → warm cream  (existing default)
 * Phase D      → slightly darker (engineering / workshop feel)
 * Phase F      → near-white (clean, professional handoff)
 *
 * Constraint marker colors map to UI_TYPES_V2 constraintLabel.
 */
export const COLORS = {
  /* Default light backgrounds */
  bg: '#e8e3d7',
  bgSoft: '#f0ebde',
  bgCard: '#ffffff',
  bgCardTint: 'rgba(255, 255, 255, 0.88)',

  /* Phase D (engineering) */
  bgEng: '#d4cfc2',
  bgEngCard: '#f5f1e6',

  /* Phase F (professional handoff) */
  bgPro: '#fafaf7',

  /* Hero / Lock */
  heroBg: '#0f0f10',

  /* Ink */
  ink: '#1c1c1a',
  inkSoft: '#4a4a48',
  inkMuted: '#7a7972',
  inkFaint: '#aaa8a0',

  /* Accents */
  line: 'rgba(28, 28, 26, 0.08)',
  lineSoft: 'rgba(28, 28, 26, 0.05)',
  lineStrong: 'rgba(28, 28, 26, 0.16)',
  warn: '#b85b1d',
  warnBg: 'rgba(184, 91, 29, 0.08)',
  good: '#2d7a4f',
  goodBg: 'rgba(45, 122, 79, 0.08)',

  /* Phase A constraint marker colors */
  constraintWindow: '#d4a72c',
  constraintDoor: '#c97a3a',
  constraintGas: '#b03a3a',
  constraintDrain: '#2c6fb8',
  constraintWater: '#2c6fb8',
  constraintOutlet: '#7a7972',
  constraintVent: '#7a4ab5',
} as const;

export type ColorToken = keyof typeof COLORS;
