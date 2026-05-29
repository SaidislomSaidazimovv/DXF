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

const MATERIAL_MULT: Record<MaterialId, number> = {
  white_classic:  1.00,
  cashmere:       1.06,
  oak_light:      1.18,
  graphite:       1.14,
  walnut:         1.32,
  anthracite:     1.22,
  /* Advisor-only entries (two-tone split) */
  matte_white:    1.04,
  standard_white: 0.92,
};

export function mockPrice(wallMm: number, variantIdx: number, material: MaterialId): number {
  const base = wallMm * BASE_PER_MM + variantIdx * VARIANT_STEP;
  return Math.round(base * MATERIAL_MULT[material]);
}

export function priceBreakdown(total: number) {
  return {
    ldsp:      Math.round(total * 0.42),
    hardware:  Math.round(total * 0.28),
    edge:      Math.round(total * 0.08),
    labor:     Math.round(total * 0.22),
  };
}
