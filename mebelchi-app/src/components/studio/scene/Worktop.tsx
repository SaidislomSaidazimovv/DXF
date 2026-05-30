/**
 * Worktop — continuous slab spanning non-tall cabinets.
 *
 * For Day 2: a single slab covering the full row width.
 * Day 3 will split it to skip over tall/fridge segments.
 */
import React from 'react';
import type { ThreeEvent } from '@/lib/three/r3f';
import { GEOMETRY } from '@/types/ui';

interface Props {
  totalWidth: number;
  centerX: number;
  centerZ: number;
  color: number;
  override?: number | null;
  isSelected?: boolean;
  onPress?: () => void;
}

const { CABINET_HEIGHT, CABINET_DEPTH, PLINTH_HEIGHT, WORKTOP_THICKNESS } = GEOMETRY;
const HIGHLIGHT_COLOR = 0x1d6fb8;

export function Worktop({ totalWidth, centerX, centerZ, color, override, isSelected = false, onPress }: Props) {
  const y = PLINTH_HEIGHT + CABINET_HEIGHT + WORKTOP_THICKNESS / 2;
  const w = totalWidth + 0.04;
  const d = CABINET_DEPTH + 0.04;
  const handle = onPress
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onPress();
      }
    : undefined;
  return (
    <group>
      <mesh position={[centerX, y, centerZ]} onClick={handle}>
        <boxGeometry args={[w, WORKTOP_THICKNESS, d]} />
        <meshStandardMaterial color={override ?? color} roughness={0.35} metalness={0.1} />
      </mesh>
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[centerX, y, centerZ]}>
          <boxGeometry args={[w + 0.04, WORKTOP_THICKNESS + 0.05, d + 0.04]} />
          <meshStandardMaterial color={HIGHLIGHT_COLOR} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
