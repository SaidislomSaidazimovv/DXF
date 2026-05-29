/**
 * Variant generator — pure function, constraint-aware.
 *
 * Given (wallMm, constraints[]) returns 2..4 variants whose cabinets are
 * ordered so that:
 *   • sink   does NOT sit under a window (it would block the window)
 *   • stove  sits as close as possible to a gas_line constraint (if any)
 *   • sink   sits as close as possible to a drain_stack / water_inlet
 *     constraint (if any)
 *   • door / hood_vent positions are informational; we don't move cabinets
 *     for them in V1 — the variant generator's job is "good enough", the
 *     mebelchi can still fine-tune in Phase C.
 *
 * Strategy: generate the base shapes (unchanged), then run a post-pass that
 * permutes cabinets within each variant to satisfy constraints. We keep the
 * total width identical — this is just re-ordering, not resizing.
 */
import type { Cabinet, CabinetType, Constraint, Variant } from '@/types/ui';

function id(variantIdx: number, pos: number): string {
  return `c${variantIdx}_${pos}`;
}

function cab(variantIdx: number, pos: number, type: CabinetType, widthMm: number): Cabinet {
  return { id: id(variantIdx, pos), type, width: widthMm / 1000 };
}

function fill(variantIdx: number, startPos: number, total: number, count: number, type: CabinetType): Cabinet[] {
  const w = Math.round(total / count / 10) * 10;
  const last = total - w * (count - 1);
  const out: Cabinet[] = [];
  for (let i = 0; i < count; i++) {
    out.push(cab(variantIdx, startPos + i, type, i === count - 1 ? last : w));
  }
  return out;
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

/**
 * Return true if [aLeft, aRight] (mm) overlaps any window constraint range.
 */
function overlapsWindow(left: number, right: number, constraints: Constraint[]): boolean {
  for (const c of constraints) {
    if (c.type !== 'window') continue;
    const halfW = (c.widthMm ?? 800) / 2;
    const wL = c.xMm - halfW;
    const wR = c.xMm + halfW;
    if (right > wL && left < wR) return true;
  }
  return false;
}

/** Distance from a cabinet's centre to nearest constraint of `kind`. */
function nearestDistance(centreMm: number, constraints: Constraint[], kind: Constraint['type']): number {
  let best = Infinity;
  for (const c of constraints) {
    if (c.type !== kind) continue;
    best = Math.min(best, Math.abs(centreMm - c.xMm));
  }
  return best;
}

/**
 * Score an ordering of cabinets given the constraint set.
 * LOWER is better. The scorer is a weighted sum of soft penalties.
 */
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

    /* Penalty 1: sink under window — hard avoid, weight 10_000 */
    if ((c.type === 'sink' || c.type === 'sink_stove') &&
        overlapsWindow(left, right, constraints)) {
      score += 10_000;
    }

    /* Penalty 2: stove far from gas_line — linear, weight 5 per mm */
    if ((c.type === 'stove' || c.type === 'sink_stove') &&
        constraints.some((k) => k.type === 'gas_line')) {
      const d = nearestDistance(centres[i], constraints, 'gas_line');
      score += d * 5;
    }

    /* Penalty 3: sink far from drain_stack / water_inlet — weight 3 per mm */
    if (c.type === 'sink' || c.type === 'sink_stove') {
      const dDrain = nearestDistance(centres[i], constraints, 'drain_stack');
      const dWater = nearestDistance(centres[i], constraints, 'water_inlet');
      const d = Math.min(dDrain, dWater);
      if (isFinite(d)) score += d * 3;
    }
  }
  return score;
}

/**
 * Try every permutation of the cabinet list and return the one with the
 * lowest constraint penalty. We limit to ≤ 7 cabinets (5040 permutations)
 * which covers every variant the generator emits.
 */
function pickBestOrder(cabinets: Cabinet[], constraints: Constraint[]): Cabinet[] {
  if (cabinets.length <= 1 || constraints.length === 0) return cabinets;
  if (cabinets.length > 7) return cabinets;  // safety

  let bestOrder = cabinets.slice();
  let bestScore = scoreOrder(bestOrder, constraints);

  const permute = (arr: Cabinet[], k: number) => {
    if (k === arr.length - 1) {
      const s = scoreOrder(arr, constraints);
      if (s < bestScore) {
        bestScore = s;
        bestOrder = arr.slice();
      }
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

/**
 * Apply constraint-aware re-ordering to a list of base variants.
 * Cabinet ids stay stable (re-ordering doesn't rename them).
 */
function applyConstraints(variants: Variant[], constraints: Constraint[]): Variant[] {
  if (constraints.length === 0) return variants;
  return variants.map((v) => ({
    ...v,
    cabinets: pickBestOrder(v.cabinets, constraints),
  }));
}

export function generateVariants(wallMm: number, constraints: Constraint[] = []): Variant[] {
  const variants: Variant[] = [];
  const W = wallMm;

  if (W <= 1500) {
    variants.push({
      name: 'Компакт',
      cabinets: [
        cab(0, 0, 'sink',   600),
        cab(0, 1, 'stove',  500),
        cab(0, 2, 'base',   W - 1100),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
    variants.push({
      name: 'Объединённая',
      cabinets: [
        cab(1, 0, 'sink_stove', 1000),
        cab(1, 1, 'drawer3',    W - 1000),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
    variants.push({
      name: 'С ящиками',
      cabinets: [
        cab(2, 0, 'sink',    600),
        cab(2, 1, 'stove',   500),
        cab(2, 2, 'drawer3', W - 1100),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
    variants.push({
      name: 'Открытые полки',
      cabinets: [
        cab(3, 0, 'sink',  600),
        cab(3, 1, 'stove', 500),
        cab(3, 2, 'base',  W - 1100),
      ],
      hasUppers: false,
      hasSideShelves: true,
    });
  } else if (W <= 2100) {
    variants.push({
      name: 'Линейная',
      cabinets: [
        cab(0, 0, 'base',   500),
        cab(0, 1, 'sink',   800),
        cab(0, 2, 'stove',  600),
        cab(0, 3, 'drawer3', W - 1900),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
    variants.push({
      name: 'С ящиками',
      cabinets: [
        cab(1, 0, 'drawer4', 600),
        cab(1, 1, 'sink',    800),
        cab(1, 2, 'stove',   600),
        cab(1, 3, 'drawer3', W - 2000),
      ],
      hasUppers: true,
      hasSideShelves: true,
    });
    variants.push({
      name: 'Компакт',
      cabinets: [
        cab(2, 0, 'sink',  900),
        cab(2, 1, 'stove', 600),
        cab(2, 2, 'base',  W - 1500),
      ],
      hasUppers: false,
      hasSideShelves: false,
    });
    variants.push({
      name: 'С пеналом',
      cabinets: [
        cab(3, 0, 'tall',   500),
        cab(3, 1, 'sink',   700),
        cab(3, 2, 'stove',  600),
        cab(3, 3, 'drawer3', W - 1800),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
  } else if (W <= 2700) {
    variants.push({
      name: 'Линейная',
      cabinets: [
        cab(0, 0, 'base',    500),
        cab(0, 1, 'drawer3', 500),
        cab(0, 2, 'sink',    800),
        cab(0, 3, 'stove',   600),
        cab(0, 4, 'base',    W - 2400),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
    variants.push({
      name: 'С пеналом',
      cabinets: [
        cab(1, 0, 'tall',    600),
        cab(1, 1, 'sink',    800),
        cab(1, 2, 'stove',   600),
        cab(1, 3, 'drawer3', W - 2000),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
    variants.push({
      name: 'С холодильником',
      cabinets: [
        cab(2, 0, 'fridge',  600),
        cab(2, 1, 'base',    500),
        cab(2, 2, 'sink',    800),
        cab(2, 3, 'stove',   600),
        cab(2, 4, 'drawer3', W - 2500),
      ],
      hasUppers: false,
      hasSideShelves: true,
    });
    variants.push({
      name: 'Два блока ящиков',
      cabinets: [
        cab(3, 0, 'drawer4', 600),
        cab(3, 1, 'sink',    800),
        cab(3, 2, 'stove',   600),
        cab(3, 3, 'drawer3', 500),
        cab(3, 4, 'base',    W - 2500),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
  } else {
    variants.push({
      name: 'С холодильником и пеналом',
      cabinets: [
        cab(0, 0, 'fridge',  600),
        cab(0, 1, 'tall',    600),
        cab(0, 2, 'sink',    800),
        cab(0, 3, 'stove',   600),
        cab(0, 4, 'drawer3', W - 2600),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
    variants.push({
      name: 'Симметрия',
      cabinets: [
        cab(1, 0, 'base',    500),
        cab(1, 1, 'drawer3', 500),
        cab(1, 2, 'sink',    800),
        cab(1, 3, 'stove',   600),
        cab(1, 4, 'drawer3', 500),
        cab(1, 5, 'base',    W - 2900),
      ],
      hasUppers: true,
      hasSideShelves: false,
    });
    variants.push({
      name: 'С большой мойкой',
      cabinets: [
        cab(2, 0, 'fridge',     600),
        cab(2, 1, 'sink_stove', 1100),
        ...fill(2, 2, W - 1700, 2, 'drawer3'),
      ],
      hasUppers: false,
      hasSideShelves: true,
    });
    variants.push({
      name: 'Полный гарнитур',
      cabinets: [
        cab(3, 0, 'fridge',  600),
        cab(3, 1, 'drawer4', 600),
        cab(3, 2, 'sink',    800),
        cab(3, 3, 'stove',   600),
        cab(3, 4, 'drawer3', W - 2600),
      ],
      hasUppers: true,
      hasSideShelves: true,
    });
  }

  return applyConstraints(variants, constraints);
}
