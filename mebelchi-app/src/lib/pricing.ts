/**
 * Mock pricing.
 * Replace with real estimate from /lib/estimate.ts (existing codebase) when
 * the editor is wired to the real engine.
 *
 * Formula calibrated so 1500mm baseline ≈ 7,337,500 сум (HANDOVER §3.1).
 */
import type { MaterialId } from '@/types/ui';

const BASE_PER_MM = 4892;
const VARIANT_STEP = 50_000;

const MATERIAL_MULT: Record<string, number> = {
  white_classic:  1.00,
  snow_white:     1.02,
  cream:          1.04,
  vanilla:        1.05,
  cashmere:       1.06,
  sand:           1.07,
  beige_warm:     1.08,
  oak_light:      1.18,
  oak_sonoma:     1.20,
  oak_amber:      1.22,
  walnut:         1.32,
  wenge:          1.30,
  cherry:         1.24,
  stone_grey:     1.14,
  dust_grey:      1.12,
  graphite:       1.20,
  anthracite:     1.22,
  black_matte:    1.26,
  sage_green:     1.16,
  olive:          1.16,
  navy:           1.21,
  dusty_blue:     1.17,
  terracotta:     1.19,
  /* Advisor-only entries (two-tone split) */
  matte_white:    1.04,
  standard_white: 0.92,
};

export function mockPrice(wallMm: number, variantIdx: number, material: MaterialId): number {
  const base = wallMm * BASE_PER_MM + variantIdx * VARIANT_STEP;
  return Math.round(base * (MATERIAL_MULT[material] ?? 1));
}

export function priceBreakdown(total: number) {
  return {
    ldsp:      Math.round(total * 0.42),
    hardware:  Math.round(total * 0.28),
    edge:      Math.round(total * 0.08),
    labor:     Math.round(total * 0.22),
  };
}
