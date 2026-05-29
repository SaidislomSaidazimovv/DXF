/**
 * DrawerStack — realistic 3D drawer fronts for a base cabinet.
 *
 * Replaces the old "thin divider lines" look. Each drawer is a real
 * recessed front panel with:
 *   • a physical reveal GAP between drawers (not a drawn line)
 *   • a slight inward bevel so the panel reads as a separate box
 *   • its own handle (bar / knob / inset) via the shared <Handle>
 *   • a faint top "lip" highlight for depth
 *
 * Heights are NON-uniform (shallow top, deep bottom) using DRAWER_FRACTIONS,
 * matching how real kitchen bases are built.
 *
 * Interaction:
 *   • tap a drawer (cabinet not selected) → select the cabinet
 *   • tap again (selected) → onCycleCount (2 → 3 → 4 → 2), so the look
 *     visibly changes — this is the "tapping changes the drawers" behaviour.
 */
import React from 'react';
import type { ThreeEvent } from '@/lib/three/r3f';
import type { HandleType } from '@/types/ui';
import { Handle } from './Handle';
import {
  CABINET_HEIGHT,
  PLINTH_HEIGHT,
  FRONT,
  DRAWER_FRACTIONS,
} from './constants';

interface Props {
  count: number;               // 2 | 3 | 4
  bodyW: number;
  facadeColor: number;
  lineCol: number;
  accent: number;
  handle: HandleType;
  isSelected: boolean;
  onSelect: () => void;
  onCycleCount: () => void;
}

const GAP = 0.008;             // reveal gap between drawer fronts (m)
const PANEL_T = 0.018;         // drawer-front thickness (m)

export function DrawerStack({
  count,
  bodyW,
  facadeColor,
  lineCol,
  accent,
  handle,
  isSelected,
  onSelect,
  onCycleCount,
}: Props) {
  const fractions = DRAWER_FRACTIONS[count] ?? DRAWER_FRACTIONS[3];
  const frontW = bodyW - 0.006;
  const baseY = PLINTH_HEIGHT;       // bottom of the drawer area (top of plinth)

  const press = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isSelected) onCycleCount();
    else onSelect();
  };

  /* Walk up from the bottom, placing each drawer front. */
  let cursorY = baseY;
  const drawers = fractions.map((frac, i) => {
    const slotH = CABINET_HEIGHT * frac;
    const frontH = slotH - GAP;
    const cy = cursorY + slotH / 2;
    cursorY += slotH;

    /* Handle sits centred near the TOP of each drawer front. */
    const handleY = cy + frontH / 2 - 0.045;

    return (
      <group key={i}>
        {/* Drawer front panel — slightly proud of the carcass */}
        <mesh position={[0, cy, FRONT]} onClick={press}>
          <boxGeometry args={[frontW, frontH, PANEL_T]} />
          <meshStandardMaterial color={facadeColor} roughness={0.62} />
        </mesh>

        {/* Top lip highlight — a thin lighter strip catching light */}
        <mesh position={[0, cy + frontH / 2 - 0.004, FRONT + PANEL_T / 2 + 0.001]}>
          <boxGeometry args={[frontW - 0.01, 0.004, 0.002]} />
          <meshStandardMaterial color={lineCol} transparent opacity={0.18} />
        </mesh>

        {/* Bottom shadow line of the front (reveal depth cue) */}
        <mesh position={[0, cy - frontH / 2 + 0.003, FRONT + PANEL_T / 2 + 0.001]}>
          <boxGeometry args={[frontW - 0.01, 0.003, 0.002]} />
          <meshStandardMaterial color={0x000000} transparent opacity={0.12} />
        </mesh>

        {/* Per-drawer handle (horizontal) */}
        <Handle
          type={handle}
          x={0}
          y={handleY}
          frontZ={FRONT + PANEL_T / 2}
          panelWidth={frontW}
          orientation="horizontal"
          accent={accent}
          onPress={isSelected ? onCycleCount : onSelect}
        />
      </group>
    );
  });

  return <group>{drawers}</group>;
}
