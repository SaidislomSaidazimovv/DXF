/**
 * Upper — wall-hung cabinet above a base cabinet.
 *
 * Three presentations (chosen in the pill, master just picks):
 *   closed — solid facade door(s) + handle (default)
 *   open   — open shelving: a frame (top/bottom/sides/back) + a shelf,
 *            no door, dark interior visible
 *   glass  — facade carcass with a tinted glass front + alu frame
 *
 * Mirrors the base cabinet's facade colour + handle style.
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
const INTERIOR = 0x2a2825;   // dark shelf interior

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

  /* ── OPEN SHELVES ─────────────────────────────────────── */
  if (kind === 'open') {
    const t = 0.016;
    return (
      <group position={[position[0], 0, upperCenterZ]}>
        {/* Dark interior back */}
        <mesh position={[0, cy, -UPPER_DEPTH / 2 + t / 2]} onClick={onBodyClick}>
          <boxGeometry args={[bodyW, UPPER_HEIGHT, t]} />
          <meshStandardMaterial color={INTERIOR} roughness={0.9} />
        </mesh>
        {/* Top + bottom */}
        <mesh position={[0, cy + UPPER_HEIGHT / 2 - t / 2, 0]} onClick={onBodyClick}>
          <boxGeometry args={[bodyW, t, UPPER_DEPTH]} />
          <meshStandardMaterial color={facadeColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, cy - UPPER_HEIGHT / 2 + t / 2, 0]} onClick={onBodyClick}>
          <boxGeometry args={[bodyW, t, UPPER_DEPTH]} />
          <meshStandardMaterial color={facadeColor} roughness={0.6} />
        </mesh>
        {/* Sides */}
        <mesh position={[-bodyW / 2 + t / 2, cy, 0]} onClick={onBodyClick}>
          <boxGeometry args={[t, UPPER_HEIGHT, UPPER_DEPTH]} />
          <meshStandardMaterial color={facadeColor} roughness={0.6} />
        </mesh>
        <mesh position={[bodyW / 2 - t / 2, cy, 0]} onClick={onBodyClick}>
          <boxGeometry args={[t, UPPER_HEIGHT, UPPER_DEPTH]} />
          <meshStandardMaterial color={facadeColor} roughness={0.6} />
        </mesh>
        {/* Two interior shelves */}
        {[-0.18, 0.12].map((dy, i) => (
          <mesh key={i} position={[0, cy + dy, 0]} onClick={onBodyClick}>
            <boxGeometry args={[bodyW - t * 2, t * 0.7, UPPER_DEPTH - 0.02]} />
            <meshStandardMaterial color={facadeColor} roughness={0.65} />
          </mesh>
        ))}
        {isSelected && <SelHighlight cy={cy} bodyW={bodyW} />}
      </group>
    );
  }

  /* ── CLOSED or GLASS — solid carcass box + front treatment ─ */
  return (
    <group position={[position[0], 0, upperCenterZ]}>
      <mesh position={[0, cy, 0]} onClick={onBodyClick}>
        <boxGeometry args={[bodyW, UPPER_HEIGHT, UPPER_DEPTH]} />
        <meshStandardMaterial color={facadeColor} roughness={0.6} />
      </mesh>

      {/* Glass front + alu frame */}
      {kind === 'glass' && (() => {
        const inset = 0.04;
        const gw = bodyW - inset * 2;
        const gh = UPPER_HEIGHT - inset * 2;
        const fr = 0.012;
        const chrome = <meshStandardMaterial color={0xb9bec2} roughness={0.3} metalness={0.85} />;
        return (
          <group>
            <mesh position={[0, cy, frontZ + 0.003]}>
              <boxGeometry args={[gw, gh, 0.003]} />
              <meshStandardMaterial color={0x20262b} transparent opacity={0.5} roughness={0.12} metalness={0.4} />
            </mesh>
            <mesh position={[0, cy + gh / 2 + fr / 2, frontZ + 0.004]}><boxGeometry args={[gw + fr * 2, fr, 0.006]} />{chrome}</mesh>
            <mesh position={[0, cy - gh / 2 - fr / 2, frontZ + 0.004]}><boxGeometry args={[gw + fr * 2, fr, 0.006]} />{chrome}</mesh>
            <mesh position={[-gw / 2 - fr / 2, cy, frontZ + 0.004]}><boxGeometry args={[fr, gh, 0.006]} />{chrome}</mesh>
            <mesh position={[gw / 2 + fr / 2, cy, frontZ + 0.004]}><boxGeometry args={[fr, gh, 0.006]} />{chrome}</mesh>
          </group>
        );
      })()}

      {/* Centre divider for double-door (closed) uppers */}
      {kind === 'closed' && isWide && (
        <mesh position={[0, cy, frontZ]}>
          <boxGeometry args={[0.003, UPPER_HEIGHT - 0.04, 0.002]} />
          <meshStandardMaterial color={lineCol} transparent opacity={0.22} />
        </mesh>
      )}

      {/* Bottom shadow strip */}
      <mesh position={[0, cy - UPPER_HEIGHT / 2 + 0.003, frontZ + 0.001]}>
        <boxGeometry args={[bodyW - 0.01, 0.006, 0.002]} />
        <meshStandardMaterial color={lineCol} transparent opacity={0.18} />
      </mesh>

      {/* Handle(s) — closed + glass both get pulls */}
      {hasHandle && (
        isWide && kind === 'closed' ? (
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
