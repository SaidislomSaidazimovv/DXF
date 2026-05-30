/**
 * Upper — wall-hung cabinet above a base cabinet.
 *
 * Three presentations (chosen in the pill, master just picks):
 *   closed — solid facade door(s) + handle (default)
 *   open   — carcass with the door(s) SWUNG OPEN on hinges, interior
 *            shelves visible
 *   glass  — carcass with a tinted but see-through glass door, interior
 *            shelves visible behind it
 *
 * Both open + glass share a carcass "shell" (frame + dark interior + 2
 * shelves) so the inside actually reads.
 */
import React from 'react';
import type { ThreeEvent } from '@/lib/three/r3f';
import { GEOMETRY } from '@/types/ui';
import type { HandleType, UpperKind } from '@/types/ui';
import { accentForFacade, lineForFacade } from '@/lib/colors';
import { Handle } from './cabinet/Handle';

interface Props {
  position: [number, number, number];
  width: number;
  facadeColor: number;
  handle?: HandleType;
  kind?: UpperKind;
  hasHandle?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const { UPPER_HEIGHT, UPPER_DEPTH, UPPER_Y_OFFSET, CABINET_DEPTH } = GEOMETRY;

const DOUBLE_DOOR_W = 0.55;
const HIGHLIGHT_COLOR = 0x1d6fb8;
const INTERIOR = 0x2a2825;   // dark interior

/** Carcass shell — frame + dark back + 2 shelves, open at the front. */
function Shell({ bodyW, cy, facadeColor }: { bodyW: number; cy: number; facadeColor: number }) {
  const t = 0.016;
  const frame = <meshStandardMaterial color={facadeColor} roughness={0.6} />;
  return (
    <group>
      {/* Dark interior back */}
      <mesh position={[0, cy, -UPPER_DEPTH / 2 + t / 2]}>
        <boxGeometry args={[bodyW, UPPER_HEIGHT, t]} />
        <meshStandardMaterial color={INTERIOR} roughness={0.9} />
      </mesh>
      {/* Top + bottom */}
      <mesh position={[0, cy + UPPER_HEIGHT / 2 - t / 2, 0]}>
        <boxGeometry args={[bodyW, t, UPPER_DEPTH]} />{frame}
      </mesh>
      <mesh position={[0, cy - UPPER_HEIGHT / 2 + t / 2, 0]}>
        <boxGeometry args={[bodyW, t, UPPER_DEPTH]} />{frame}
      </mesh>
      {/* Sides */}
      <mesh position={[-bodyW / 2 + t / 2, cy, 0]}>
        <boxGeometry args={[t, UPPER_HEIGHT, UPPER_DEPTH]} />{frame}
      </mesh>
      <mesh position={[bodyW / 2 - t / 2, cy, 0]}>
        <boxGeometry args={[t, UPPER_HEIGHT, UPPER_DEPTH]} />{frame}
      </mesh>
      {/* Two interior shelves */}
      {[-0.18, 0.12].map((dy, i) => (
        <mesh key={i} position={[0, cy + dy, 0]}>
          <boxGeometry args={[bodyW - t * 2, t * 0.7, UPPER_DEPTH - 0.02]} />{frame}
        </mesh>
      ))}
    </group>
  );
}

/** One swung-open door, hinged at `hingeX`, opening forward. */
function OpenDoor({
  hingeX, doorW, cy, facadeColor, accent, handle, dir,
}: {
  hingeX: number; doorW: number; cy: number; facadeColor: number;
  accent: number; handle: HandleType; dir: 1 | -1;   // dir = which side it swings
}) {
  const frontZ = UPPER_DEPTH / 2;
  /* Group pivots at the hinge (outer edge, front face). The door panel
     extends inward toward the centre (local +x for the left door, scaled by
     dir). Rotating by -dir·θ swings the FREE edge forward toward the viewer
     (+Z) — a real door opening outward, ~100°. (Using +dir would swing it
     backward into the carcass — the earlier bug.) */
  const openAngle = -dir * 1.75;
  return (
    <group position={[hingeX, cy, frontZ]} rotation={[0, openAngle, 0]}>
      <mesh position={[dir * doorW / 2, 0, 0.008]}>
        <boxGeometry args={[doorW, UPPER_HEIGHT - 0.02, 0.016]} />
        <meshStandardMaterial color={facadeColor} roughness={0.55} />
      </mesh>
      {/* Handle on the door FACE, near the free (inner) edge, mid-low so it
         never pokes past the panel edges. */}
      <Handle
        type={handle}
        x={dir * (doorW - 0.05)}
        y={-0.08}
        frontZ={0.016}
        panelWidth={doorW * 0.7}
        orientation="vertical"
        accent={accent}
      />
    </group>
  );
}

export function Upper({
  position,
  width,
  facadeColor,
  handle = 'bar',
  kind = 'closed',
  hasHandle = true,
  isSelected = false,
  onSelect,
}: Props) {
  const bodyW = width - 0.003;
  const cy = UPPER_Y_OFFSET + UPPER_HEIGHT / 2;
  const baseBackZ = position[2] - CABINET_DEPTH / 2;
  const upperCenterZ = baseBackZ + UPPER_DEPTH / 2;
  const accent = accentForFacade(facadeColor);
  const lineCol = lineForFacade(facadeColor);
  const frontZ = UPPER_DEPTH / 2;
  const isWide = bodyW > DOUBLE_DOOR_W;

  const onBodyClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect?.();
  };
  const handlePress = () => onSelect?.();

  /* ── OPEN — carcass + doors swung open ─────────────────── */
  if (kind === 'open') {
    return (
      <group position={[position[0], 0, upperCenterZ]} onClick={onBodyClick}>
        <Shell bodyW={bodyW} cy={cy} facadeColor={facadeColor} />
        {isWide ? (
          <>
            <OpenDoor hingeX={-bodyW / 2} doorW={bodyW / 2} cy={cy} facadeColor={facadeColor} accent={accent} handle={handle} dir={1} />
            <OpenDoor hingeX={+bodyW / 2} doorW={bodyW / 2} cy={cy} facadeColor={facadeColor} accent={accent} handle={handle} dir={-1} />
          </>
        ) : (
          <OpenDoor hingeX={-bodyW / 2} doorW={bodyW} cy={cy} facadeColor={facadeColor} accent={accent} handle={handle} dir={1} />
        )}
        {isSelected && <SelHighlight cy={cy} bodyW={bodyW} />}
      </group>
    );
  }

  /* ── GLASS — carcass shell + see-through glass door ────── */
  if (kind === 'glass') {
    const inset = 0.03;
    const gw = bodyW - inset * 2;
    const gh = UPPER_HEIGHT - inset * 2;
    const fr = 0.012;
    const chrome = <meshStandardMaterial color={0xb9bec2} roughness={0.3} metalness={0.85} />;
    return (
      <group position={[position[0], 0, upperCenterZ]} onClick={onBodyClick}>
        <Shell bodyW={bodyW} cy={cy} facadeColor={facadeColor} />
        {/* See-through glass (low opacity so shelves read) */}
        <mesh position={[0, cy, frontZ - 0.002]}>
          <boxGeometry args={[gw, gh, 0.003]} />
          <meshStandardMaterial color={0x33403f} transparent opacity={0.22} roughness={0.1} metalness={0.3} />
        </mesh>
        {/* Aluminium frame */}
        <mesh position={[0, cy + gh / 2 + fr / 2, frontZ]}><boxGeometry args={[gw + fr * 2, fr, 0.01]} />{chrome}</mesh>
        <mesh position={[0, cy - gh / 2 - fr / 2, frontZ]}><boxGeometry args={[gw + fr * 2, fr, 0.01]} />{chrome}</mesh>
        <mesh position={[-gw / 2 - fr / 2, cy, frontZ]}><boxGeometry args={[fr, gh, 0.01]} />{chrome}</mesh>
        <mesh position={[gw / 2 + fr / 2, cy, frontZ]}><boxGeometry args={[fr, gh, 0.01]} />{chrome}</mesh>
        {isSelected && <SelHighlight cy={cy} bodyW={bodyW} />}
      </group>
    );
  }

  /* ── CLOSED — solid facade box + handle(s) ─────────────── */
  return (
    <group position={[position[0], 0, upperCenterZ]}>
      <mesh position={[0, cy, 0]} onClick={onBodyClick}>
        <boxGeometry args={[bodyW, UPPER_HEIGHT, UPPER_DEPTH]} />
        <meshStandardMaterial color={facadeColor} roughness={0.6} />
      </mesh>

      {isWide && (
        <mesh position={[0, cy, frontZ]}>
          <boxGeometry args={[0.003, UPPER_HEIGHT - 0.04, 0.002]} />
          <meshStandardMaterial color={lineCol} transparent opacity={0.22} />
        </mesh>
      )}

      <mesh position={[0, cy - UPPER_HEIGHT / 2 + 0.003, frontZ + 0.001]}>
        <boxGeometry args={[bodyW - 0.01, 0.006, 0.002]} />
        <meshStandardMaterial color={lineCol} transparent opacity={0.18} />
      </mesh>

      {hasHandle && (
        isWide ? (
          <>
            <Handle type={handle} x={-bodyW / 4} y={cy - UPPER_HEIGHT / 2 + 0.05} frontZ={frontZ}
              panelWidth={bodyW / 2} orientation="horizontal" accent={accent} onPress={handlePress} />
            <Handle type={handle} x={+bodyW / 4} y={cy - UPPER_HEIGHT / 2 + 0.05} frontZ={frontZ}
              panelWidth={bodyW / 2} orientation="horizontal" accent={accent} onPress={handlePress} />
          </>
        ) : (
          <Handle type={handle} x={0} y={cy - UPPER_HEIGHT / 2 + 0.05} frontZ={frontZ}
            panelWidth={bodyW} orientation="horizontal" accent={accent} onPress={handlePress} />
        )
      )}

      {isSelected && <SelHighlight cy={cy} bodyW={bodyW} />}
    </group>
  );
}

function SelHighlight({ cy, bodyW }: { cy: number; bodyW: number }) {
  return (
    <mesh position={[0, cy, 0]}>
      <boxGeometry args={[bodyW + 0.04, UPPER_HEIGHT + 0.05, UPPER_DEPTH + 0.05]} />
      <meshStandardMaterial color={HIGHLIGHT_COLOR} transparent opacity={0.16} roughness={0.4} depthWrite={false} />
    </mesh>
  );
}
