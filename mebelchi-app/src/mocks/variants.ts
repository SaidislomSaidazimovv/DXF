/**
 * Variant generator — pure function, constraint-aware.
 *
 * Produces a large set (up to 24) of distinct kitchen layouts for a given
 * wall, built combinatorially from layout "recipes" × filler types, then:
 *   • filtered to those that physically fit the wall
 *   • de-duplicated by cabinet signature
 *   • re-ordered to satisfy Phase A constraints (sink not under window,
 *     stove near gas, sink near drain/water)
 */
import type { Cabinet, CabinetType, Constraint, Variant } from '@/types/ui';

function id(variantIdx: number, pos: number): string {
  return `c${variantIdx}_${pos}`;
}

function cab(variantIdx: number, pos: number, type: CabinetType, widthMm: number): Cabinet {
  return { id: id(variantIdx, pos), type, width: widthMm / 1000 };
}

/**
 * Return the X centre (mm from left wall) of each cabinet given current order.
 */
function cabinetCentres(cabinets: Cabinet[]): number[] {
  const out: number[] = [];
  let x = 0;
  for (const c of cabinets) {
    const wMm = c.width * 1000;
    out.push(x + wMm / 2);
    x += wMm;
  }
  return out;
}

/** True if [left,right] (mm) overlaps any window constraint range. */
function overlapsWindow(left: number, right: number, constraints: Constraint[]): boolean {
  for (const c of constraints) {
    if (c.type !== 'window') continue;
    const halfW = (c.widthMm ?? 800) / 2;
    if (right > c.xMm - halfW && left < c.xMm + halfW) return true;
  }
  return false;
}

/** Distance from a cabinet centre to nearest constraint of `kind`. */
function nearestDistance(centreMm: number, constraints: Constraint[], kind: Constraint['type']): number {
  let best = Infinity;
  for (const c of constraints) {
    if (c.type !== kind) continue;
    best = Math.min(best, Math.abs(centreMm - c.xMm));
  }
  return best;
}

/** Score an ordering against constraints. LOWER is better. */
function scoreOrder(cabinets: Cabinet[], constraints: Constraint[]): number {
  if (constraints.length === 0) return 0;
  const centres = cabinetCentres(cabinets);
  let score = 0;
  let x = 0;
  for (let i = 0; i < cabinets.length; i++) {
    const c = cabinets[i];
    const wMm = c.width * 1000;
    const left = x;
    const right = x + wMm;
    x = right;

    if ((c.type === 'sink' || c.type === 'sink_stove') &&
        overlapsWindow(left, right, constraints)) {
      score += 10_000;
    }
    if ((c.type === 'stove' || c.type === 'sink_stove') &&
        constraints.some((k) => k.type === 'gas_line')) {
      score += nearestDistance(centres[i], constraints, 'gas_line') * 5;
    }
    if (c.type === 'sink' || c.type === 'sink_stove') {
      const d = Math.min(
        nearestDistance(centres[i], constraints, 'drain_stack'),
        nearestDistance(centres[i], constraints, 'water_inlet'),
      );
      if (isFinite(d)) score += d * 3;
    }
  }
  return score;
}

/** Best permutation (≤7 cabinets) under the constraint scorer. */
function pickBestOrder(cabinets: Cabinet[], constraints: Constraint[]): Cabinet[] {
  if (cabinets.length <= 1 || constraints.length === 0) return cabinets;
  if (cabinets.length > 7) return cabinets;

  let bestOrder = cabinets.slice();
  let bestScore = scoreOrder(bestOrder, constraints);

  const permute = (arr: Cabinet[], k: number) => {
    if (k === arr.length - 1) {
      const s = scoreOrder(arr, constraints);
      if (s < bestScore) { bestScore = s; bestOrder = arr.slice(); }
      return;
    }
    for (let i = k; i < arr.length; i++) {
      [arr[k], arr[i]] = [arr[i], arr[k]];
      permute(arr, k + 1);
      [arr[k], arr[i]] = [arr[i], arr[k]];
    }
  };
  permute(cabinets.slice(), 0);
  return bestOrder;
}

function applyConstraints(variants: Variant[], constraints: Constraint[]): Variant[] {
  if (constraints.length === 0) return variants;
  return variants.map((v) => ({ ...v, cabinets: pickBestOrder(v.cabinets, constraints) }));
}

// ── Recipe model ──────────────────────────────────────────────
type Piece = { type: CabinetType; w: number } | 'F';   // 'F' = filler (absorbs remainder)
interface Recipe { name: string; pieces: Piece[]; uppers: boolean; shelves: boolean; }

const P = (type: CabinetType, w: number): Piece => ({ type, w });
const F: Piece = 'F';

/* Appliance widths kept modest so layouts still fit small (1500mm) walls. */
const SINK = 700, STOVE = 500, FRIDGE = 600, TALL = 550, COMBO = 1000, BASE = 500;

const RECIPES: Recipe[] = [
  { name: 'Линейная',            pieces: [P('sink', SINK), P('stove', STOVE), F],                                uppers: true,  shelves: false },
  { name: 'Зеркальная',          pieces: [F, P('sink', SINK), P('stove', STOVE)],                                uppers: true,  shelves: false },
  { name: 'Разнесённая',         pieces: [P('sink', SINK), F, P('stove', STOVE)],                                uppers: true,  shelves: false },
  { name: 'С тумбой слева',      pieces: [P('base', BASE), P('sink', SINK), P('stove', STOVE), F],               uppers: true,  shelves: false },
  { name: 'С тумбой справа',     pieces: [F, P('sink', SINK), P('stove', STOVE), P('base', BASE)],               uppers: true,  shelves: false },
  { name: 'С холодильником',     pieces: [P('fridge', FRIDGE), P('sink', SINK), P('stove', STOVE), F],           uppers: true,  shelves: false },
  { name: 'Холодильник справа',  pieces: [F, P('sink', SINK), P('stove', STOVE), P('fridge', FRIDGE)],           uppers: false, shelves: true  },
  { name: 'С пеналом',           pieces: [P('tall', TALL), P('sink', SINK), P('stove', STOVE), F],               uppers: true,  shelves: false },
  { name: 'Пенал + холодильник', pieces: [P('fridge', FRIDGE), P('tall', TALL), P('sink', SINK), P('stove', STOVE), F], uppers: true, shelves: false },
  { name: 'Объединённая',        pieces: [P('sink_stove', COMBO), F],                                            uppers: true,  shelves: false },
  { name: 'Объединённая центр',  pieces: [F, P('sink_stove', COMBO), F],                                         uppers: true,  shelves: false },
  { name: 'Объединённая + холод',pieces: [P('fridge', FRIDGE), P('sink_stove', COMBO), F],                       uppers: false, shelves: true  },
  { name: 'Симметрия',           pieces: [P('base', BASE), P('sink', SINK), P('stove', STOVE), P('base', BASE), F], uppers: true, shelves: false },
  { name: 'Двойные тумбы',       pieces: [P('sink', SINK), P('stove', STOVE), F, F],                             uppers: true,  shelves: false },
  { name: 'С нишей',             pieces: [P('fridge', FRIDGE), F, P('sink', SINK), P('stove', STOVE), F],        uppers: true,  shelves: true  },
  { name: 'Студийная',           pieces: [P('sink', SINK), P('stove', STOVE), F],                                uppers: false, shelves: true  },
];

const FILLERS: { type: CabinetType; label: string }[] = [
  { type: 'base',    label: 'тумбы' },
  { type: 'drawer3', label: 'ящики' },
  { type: 'drawer4', label: 'ящики×4' },
];

const MIN_FILLER = 250;   // mm — below this a filler cabinet is silly
const MAX_FILLER = 1100;  // mm — above this prefer a recipe with more fillers
const MAX_VARIANTS = 24;

export function generateVariants(wallMm: number, constraints: Constraint[] = []): Variant[] {
  const W = wallMm;
  const out: Variant[] = [];
  const seen = new Set<string>();

  for (const r of RECIPES) {
    const fixedSum = r.pieces.reduce((s, p) => s + (p === 'F' ? 0 : p.w), 0);
    const fillerCount = r.pieces.filter((p) => p === 'F').length;
    if (fillerCount === 0) continue;

    const remainder = W - fixedSum;
    if (remainder < fillerCount * MIN_FILLER) continue;
    const per = Math.round(remainder / fillerCount / 10) * 10;
    if (per < MIN_FILLER || per > MAX_FILLER) continue;

    for (const fk of FILLERS) {
      const idx = out.length;
      const cabs: Cabinet[] = [];
      let pos = 0;
      let fillersDone = 0;
      for (const p of r.pieces) {
        if (p === 'F') {
          const w = fillersDone === fillerCount - 1
            ? remainder - per * (fillerCount - 1)   // last filler absorbs rounding
            : per;
          cabs.push(cab(idx, pos++, fk.type, w));
          fillersDone++;
        } else {
          cabs.push(cab(idx, pos++, p.type, p.w));
        }
      }

      const sig = cabs.map((c) => c.type + Math.round(c.width * 1000)).join('|');
      if (seen.has(sig)) continue;
      seen.add(sig);

      out.push({
        name: `${r.name} · ${fk.label}`,
        cabinets: cabs,
        hasUppers: r.uppers,
        hasSideShelves: r.shelves,
      });
      if (out.length >= MAX_VARIANTS) break;
    }
    if (out.length >= MAX_VARIANTS) break;
  }

  /* Fallback for very tight walls where no recipe fit. */
  if (out.length === 0) {
    const sinkW = Math.min(700, Math.round(W * 0.5));
    out.push({
      name: 'Компакт',
      cabinets: [
        cab(0, 0, 'sink', sinkW),
        cab(0, 1, 'stove', Math.max(300, W - sinkW)),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
  }

  return applyConstraints(out, constraints);
}
