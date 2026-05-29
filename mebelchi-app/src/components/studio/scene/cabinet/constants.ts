/**
 * Cabinet part constants — single source of truth shared by every
 * cabinet sub-component (body, doors, drawers, oven/sink fronts, x-ray).
 *
 * Keeping these here means a geometry tweak (e.g. front panel offset) is
 * made ONCE and every part stays consistent — no drift between modules.
 */
import { GEOMETRY } from '@/types/ui';

export const {
  CABINET_HEIGHT,
  CABINET_DEPTH,
  PLINTH_HEIGHT,
  TALL_HEIGHT,
  WORKTOP_THICKNESS,
} = GEOMETRY;

/** Half-depth and the z of the cabinet front face (where facades sit). */
export const D2 = CABINET_DEPTH / 2;
export const FRONT = D2 + 0.001;

/** Above this width a base cabinet gets a double door instead of single. */
export const DOUBLE_DOOR_W = 0.55;

/** Selection highlight box tint (blue, low opacity). */
export const HIGHLIGHT_COLOR = 0x1d6fb8;

/* Phase-D X-ray palette */
export const DRILL_COLOR = 0xc8302d;   // red — drill marks (32mm system)
export const HINGE_COLOR = 0x2d9a4a;   // green — hinge cup positions
export const SLIDE_COLOR = 0x9a9a99;   // grey — drawer slide rails
export const CARCASS_COLOR = 0xd6cfbf; // light LDSP edge tint
export const BENCHMARK_OK = 0x2d7a4f;  // green status dot

/** Chrome tone for handles, faucet, oven trim. */
export const CHROME = 0xbfc4c8;

/**
 * Vertical height fractions for a drawer stack, by drawer count.
 * Real kitchen bases use a shallow top drawer + deeper lower drawers —
 * NOT equal slices. Fractions sum to 1.
 */
export const DRAWER_FRACTIONS: Record<number, number[]> = {
  2: [0.4, 0.6],
  3: [0.22, 0.39, 0.39],
  4: [0.18, 0.24, 0.29, 0.29],
};
