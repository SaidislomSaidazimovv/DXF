/**
 * Color helpers — perceived luminance + accent picking.
 *
 * Used so handles / dividers / frames pick a CONTRAST color against the
 * facade automatically: dark facade → light accent, light facade → dark.
 */

/** Rec. 601 luma — 0 (black) … 1 (white). */
export function luminance(hex: number): number {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function isDarkColor(hex: number): boolean {
  return luminance(hex) < 0.5;
}

/** Handle / hardware accent color that contrasts the facade. */
export function accentForFacade(hex: number): number {
  return isDarkColor(hex) ? 0xc0c0bd : 0x2c2c2a;
}

/** Divider / groove / frame line color (paired with opacity ≈ 0.18). */
export function lineForFacade(hex: number): number {
  return isDarkColor(hex) ? 0xffffff : 0x000000;
}
