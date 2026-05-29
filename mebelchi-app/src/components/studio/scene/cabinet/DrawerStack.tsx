/**
 * DrawerStack — realistic 3D drawer fronts for a base cabinet.
 *
 * Each drawer is a real front panel standing PROUD of the carcass, with a
 * recessed shadow groove between drawers (a dark plane set back in the gap)
 * so the divisions read as real reveals — not painted-on flat lines.
 *
 * Heights are NON-uniform (shallow top, deep bottom) via DRAWER_FRACTIONS.
 *
 * Tapping a drawer just SELECTS the cabinet — the drawer count is changed
 * from the selection pill, never by tapping (so a stray tap can't alter it).
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
  onSelect: () => void;
}

const GAP = 0.012;             // reveal gap between drawer fronts (m)
const PANEL_T = 0.02;          // drawer-front thickness — stands proud (m)
const GROOVE_COLOR = 0x1a1816; // dark recess seen in the gap

export function DrawerStack({
  count,
  bodyW,
  facadeColor,
  accent,
  handle,
  onSelect,
}: Props) {
  const fractions = DRAWER_FRACTIONS[count] ?? DRAWER_FRACTIONS[3];
  const frontW = bodyW - 0.006;
  const baseY = PLINTH_HEIGHT;       // bottom of the drawer area (top of plinth)

  const press = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  };

  let cursorY = baseY;
  const drawers = fractions.map((frac, i) => {
    const slotH = CABINET_HEIGHT * frac;
    const frontH = slotH - GAP;
    const cy = cursorY + slotH / 2;
    cursorY += slotH;
    const handleY = cy + frontH / 2 - 0.05;

    return (
      <group key={i}>
        {/* Recessed dark groove behind the gap below this drawer — set back
            so the reveal reads as a real shadowed recess, not a line. */}
        <mesh position={[0, cy - frontH / 2 - GAP / 2, FRONT - 0.006]}>
          <boxGeometry args={[frontW, GAP + 0.004, 0.004]} />
          <meshStandardMaterial color={GROOVE_COLOR} roughness={0.9} />
        </mesh>

        {/* Drawer front panel — proud of the carcass, slightly bevelled feel */}
        <mesh position={[0, cy, FRONT]} onClick={press}>
          <boxGeometry args={[frontW, frontH, PANEL_T]} />
          <meshStandardMaterial color={facadeColor} roughness={0.6} />
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
          onPress={onSelect}
        />
      </group>
    );
  });

  return <group>{drawers}</group>;
}
