/**
 * DrawerStack — realistic 3D drawer fronts for a base cabinet.
 *
 * Each drawer can be one of three presentations (per-drawer, chosen in the
 * selection pill — the master just picks, no thinking):
 *   • closed    — flush front standing proud of the carcass (default)
 *   • open      — front pulled forward + the open box (sides/back/bottom)
 *   • organizer — open box + cutlery-tray dividers on the bottom
 *
 * Heights are NON-uniform (shallow top, deep bottom) via DRAWER_FRACTIONS.
 * Reveals between drawers are recessed dark grooves (real shadow, not lines).
 *
 * Tapping a drawer just SELECTS the cabinet — the type is changed from the
 * pill, never by tapping.
 */
import React from 'react';
import type { ThreeEvent } from '@/lib/three/r3f';
import type { HandleType, DrawerKind } from '@/types/ui';
import { useUI } from '@/store/uiStore';
import { Handle } from './Handle';
import {
  CABINET_HEIGHT,
  CABINET_DEPTH,
  PLINTH_HEIGHT,
  FRONT,
  DRAWER_FRACTIONS,
} from './constants';

interface Props {
  cabId: string;
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
const BOX_COLOR = 0xcfc6b4;    // light interior of an open drawer box
const BOX_WALL = 0x9a8f78;     // box side walls
const OPEN_OUT = 0.26;         // how far an open drawer slides forward (m)

function OpenBox({
  w, h, frontFaceY, organizer, lineCol,
}: { w: number; h: number; frontFaceY: number; organizer: boolean; lineCol: number }) {
  const depth = CABINET_DEPTH - 0.08;
  const innerW = w - 0.02;
  const wallT = 0.012;
  /* Box centre sits between the cabinet front and the pulled-out front. */
  const zCenter = FRONT + OPEN_OUT / 2 - depth / 2;
  const wallY = frontFaceY;
  return (
    <group>
      {/* Bottom */}
      <mesh position={[0, frontFaceY - h / 2 + 0.01, zCenter]}>
        <boxGeometry args={[innerW, 0.012, depth]} />
        <meshStandardMaterial color={BOX_COLOR} roughness={0.8} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-innerW / 2 + wallT / 2, wallY, zCenter]}>
        <boxGeometry args={[wallT, h - 0.03, depth]} />
        <meshStandardMaterial color={BOX_WALL} roughness={0.75} />
      </mesh>
      <mesh position={[+innerW / 2 - wallT / 2, wallY, zCenter]}>
        <boxGeometry args={[wallT, h - 0.03, depth]} />
        <meshStandardMaterial color={BOX_WALL} roughness={0.75} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, wallY, zCenter - depth / 2 + wallT / 2]}>
        <boxGeometry args={[innerW, h - 0.03, wallT]} />
        <meshStandardMaterial color={BOX_WALL} roughness={0.75} />
      </mesh>

      {/* Organizer dividers — cutlery-tray look on the bottom */}
      {organizer && (
        <>
          {[-0.18, 0, 0.18].map((fx, i) => (
            <mesh key={'lx' + i} position={[innerW * fx, frontFaceY - h / 2 + 0.03, zCenter]}>
              <boxGeometry args={[0.006, 0.04, depth - 0.04]} />
              <meshStandardMaterial color={lineCol} roughness={0.7} />
            </mesh>
          ))}
          {[-depth * 0.18, depth * 0.18].map((fz, i) => (
            <mesh key={'lz' + i} position={[0, frontFaceY - h / 2 + 0.03, zCenter + fz]}>
              <boxGeometry args={[innerW - 0.02, 0.04, 0.006]} />
              <meshStandardMaterial color={lineCol} roughness={0.7} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

export function DrawerStack({
  cabId,
  count,
  bodyW,
  facadeColor,
  lineCol,
  accent,
  handle,
  onSelect,
}: Props) {
  const drawerTypes = useUI((s) => s.drawerTypes);
  const fractions = DRAWER_FRACTIONS[count] ?? DRAWER_FRACTIONS[3];
  const frontW = bodyW - 0.006;
  const baseY = PLINTH_HEIGHT;

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

    const kind: DrawerKind = drawerTypes[`${cabId}#${i}`] ?? 'closed';
    const isOpen = kind === 'open' || kind === 'organizer';
    const frontZ = isOpen ? FRONT + OPEN_OUT : FRONT;

    return (
      <group key={i}>
        {/* Recessed dark groove behind the gap below this drawer */}
        <mesh position={[0, cy - frontH / 2 - GAP / 2, FRONT - 0.006]}>
          <boxGeometry args={[frontW, GAP + 0.004, 0.004]} />
          <meshStandardMaterial color={GROOVE_COLOR} roughness={0.9} />
        </mesh>

        {/* Open box (visible cavity) when pulled out */}
        {isOpen && (
          <OpenBox
            w={frontW}
            h={frontH}
            frontFaceY={cy}
            organizer={kind === 'organizer'}
            lineCol={lineCol}
          />
        )}

        {/* Drawer front panel — pushed forward when open */}
        <mesh position={[0, cy, frontZ]} onClick={press}>
          <boxGeometry args={[frontW, frontH, PANEL_T]} />
          <meshStandardMaterial color={facadeColor} roughness={0.6} />
        </mesh>

        {/* Per-drawer handle (rides with the front) */}
        <Handle
          type={handle}
          x={0}
          y={handleY}
          frontZ={frontZ + PANEL_T / 2}
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
