/**
 * Layout helpers — compute cabinet world positions from a variant.
 *
 * Single source of truth used by:
 *   - Kitchen.tsx (rendering positions)
 *   - CameraRig.tsx (where to tween to when a cabinet is selected)
 */
import type { Cabinet, Variant } from '@/types/ui';
import { GEOMETRY } from '@/types/ui';

export const KITCHEN_CABINET_CENTER_Z =
  -0.65 + 0.03 + GEOMETRY.CABINET_DEPTH / 2;

export interface PlacedCabinet {
  cab: Cabinet;
  /** floor-level group position (x at cabinet center, y=0, z at cabinet center) */
  groupPosition: [number, number, number];
  /** body center y in world coords */
  bodyCenterY: number;
  /** body height */
  bodyHeight: number;
  /** start/end x of this cabinet (for segment detection) */
  xStart: number;
  xEnd: number;
  isTall: boolean;
}

export function isTallType(t: Cabinet['type']): boolean {
  return t === 'tall' || t === 'fridge';
}

export function layoutVariant(variant: Variant): PlacedCabinet[] {
  const totalW = variant.cabinets.reduce((s, c) => s + c.width, 0);
  let cursor = -totalW / 2;
  return variant.cabinets.map((cab): PlacedCabinet => {
    const xStart = cursor;
    const xCenter = cursor + cab.width / 2;
    const xEnd = cursor + cab.width;
    cursor += cab.width;
    const isTall = isTallType(cab.type);
    const bodyHeight = isTall ? GEOMETRY.TALL_HEIGHT : GEOMETRY.CABINET_HEIGHT;
    const bodyCenterY = isTall
      ? bodyHeight / 2
      : GEOMETRY.PLINTH_HEIGHT + bodyHeight / 2;
    return {
      cab,
      groupPosition: [xCenter, 0, KITCHEN_CABINET_CENTER_Z],
      bodyCenterY,
      bodyHeight,
      xStart,
      xEnd,
      isTall,
    };
  });
}

export function findPlaced(
  variant: Variant | undefined,
  cabId: string | null
): PlacedCabinet | null {
  if (!variant || !cabId) return null;
  return layoutVariant(variant).find((p) => p.cab.id === cabId) ?? null;
}
