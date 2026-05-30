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

/**
 * OpenBox — the visible drawer box for a pulled-out drawer. It connects
 * tightly to the BACK of the proud front panel and extends into the carcass,
 * so the front + bottom + 2 sides + back read as one solid open container
 * (not loose floating pieces).
 */
function OpenBox({
  w, h, frontFaceY, frontZ, organizer, lineCol,
}: { w: number; h: number; frontFaceY: number; frontZ: number; organizer: boolean; lineCol: number }) {
  const wallT = 0.014;
  const innerW = w - 0.004;
  /* Front of the box meets the back face of the door panel; back sits in
     the carcass. depth/zCenter computed so there are no gaps. */
  const boxFrontZ = frontZ - PANEL_T / 2;
  const boxBackZ = FRONT - 0.30;
  const depth = boxFrontZ - boxBackZ;
  const zCenter = (boxFrontZ + boxBackZ) / 2;

  const bottomY = frontFaceY - h / 2 + wallT / 2;
  const wallH = h - 0.006;
  const wallY = bottomY - wallT / 2 + wallH / 2;

  return (
    <group>
      {/* Bottom — full footprint */}
      <mesh position={[0, bottomY, zCenter]}>
        <boxGeometry args={[innerW, wallT, depth]} />
        <meshStandardMaterial color={BOX_COLOR} roughness={0.8} />
      </mesh>
      {/* Left + right side walls — full depth, flush with bottom & front */}
      <mesh position={[-innerW / 2 + wallT / 2, wallY, zCenter]}>
        <boxGeometry args={[wallT, wallH, depth]} />
        <meshStandardMaterial color={BOX_WALL} roughness={0.75} />
      </mesh>
      <mesh position={[+innerW / 2 - wallT / 2, wallY, zCenter]}>
        <boxGeometry args={[wallT, wallH, depth]} />
        <meshStandardMaterial color={BOX_WALL} roughness={0.75} />
      </mesh>
      {/* Back wall — closes the rear, flush with sides */}
      <mesh position={[0, wallY, boxBackZ + wallT / 2]}>
        <boxGeometry args={[innerW, wallH, wallT]} />
        <meshStandardMaterial color={BOX_WALL} roughness={0.75} />
      </mesh>

      {/* Organizer dividers — cutlery-tray grid on the bottom */}
      {organizer && (
        <>
          {[-0.3, 0, 0.3].map((fx, i) => (
            <mesh key={'lx' + i} position={[innerW * fx, bottomY + 0.025, zCenter]}>
              <boxGeometry args={[0.006, 0.045, depth - 0.04]} />
              <meshStandardMaterial color={lineCol} roughness={0.7} />
            </mesh>
          ))}
          {[-depth * 0.2, depth * 0.2].map((fz, i) => (
            <mesh key={'lz' + i} position={[0, bottomY + 0.025, zCenter + fz]}>
              <boxGeometry args={[innerW - 0.03, 0.045, 0.006]} />
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

        {/* Open box (visible cavity) when pulled out — connects to the front */}
        {isOpen && (
          <OpenBox
            w={frontW}
            h={frontH}
            frontFaceY={cy}
            frontZ={frontZ}
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
