/**
 * Handle — a single cabinet/drawer pull, rendered in 3 styles.
 *
 *   bar   → horizontal chrome bar standing off the face
 *   knob  → small round knob
 *   inset → thin vertical groove handle near the edge
 *
 * Shared by doors AND drawers so the look stays consistent everywhere.
 * Position is given in cabinet-local coordinates; the handle sits just in
 * front of the facade plane (`frontZ`).
 */
import React from 'react';
import type { ThreeEvent } from '@/lib/three/r3f';
import type { HandleType } from '@/types/ui';

interface Props {
  type: HandleType;
  /** Centre X of the handle in cabinet-local space (m). */
  x: number;
  /** Centre Y of the handle (m). */
  y: number;
  /** Front-face Z (m). */
  frontZ: number;
  /** Visible width of the panel this handle belongs to (m) — sizes a bar. */
  panelWidth: number;
  /** Orientation — door handles are vertical-ish, drawer handles horizontal. */
  orientation?: 'horizontal' | 'vertical';
  accent: number;
  onPress?: () => void;
}

function stop(cb?: () => void) {
  return (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    cb?.();
  };
}

export function Handle({
  type,
  x,
  y,
  frontZ,
  panelWidth,
  orientation = 'horizontal',
  accent,
  onPress,
}: Props) {
  const press = stop(onPress);

  if (type === 'knob') {
    return (
      <mesh position={[x, y, frontZ + 0.011]} rotation={[Math.PI / 2, 0, 0]} onClick={press}>
        <cylinderGeometry args={[0.013, 0.013, 0.018, 16]} />
        <meshStandardMaterial color={accent} roughness={0.28} metalness={0.6} />
      </mesh>
    );
  }

  if (type === 'inset') {
    /* Thin recessed groove — vertical for doors, horizontal for drawers */
    const len = orientation === 'vertical'
      ? Math.min(0.12, panelWidth * 0.6)
      : Math.min(0.14, panelWidth * 0.4);
    const args: [number, number, number] =
      orientation === 'vertical' ? [0.004, len, 0.003] : [len, 0.004, 0.003];
    return (
      <mesh position={[x, y, frontZ + 0.001]} onClick={press}>
        <boxGeometry args={args} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.4} />
      </mesh>
    );
  }

  /* bar (default) */
  const len = Math.min(0.16, panelWidth * 0.5);
  const args: [number, number, number] =
    orientation === 'vertical' ? [0.01, len, 0.012] : [len, 0.009, 0.013];
  return (
    <mesh position={[x, y, frontZ + 0.012]} onClick={press}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={accent} roughness={0.28} metalness={0.62} />
    </mesh>
  );
}
