/**
 * Floor — 14×10 plane, color 0xe5dfd1.
 * Click → deselects (HANDOVER §3.2 gesture #7).
 */
import React from 'react';
import type { ThreeEvent } from '@/lib/three/r3f';

interface Props {
  onPress?: () => void;
}

export function Floor({ onPress }: Props) {
  const handle = onPress
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onPress();
      }
    : undefined;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={handle}>
      <planeGeometry args={[14, 10]} />
      <meshStandardMaterial color={0xe5dfd1} roughness={1} />
    </mesh>
  );
}
