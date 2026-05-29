/**
 * Back wall — 14×4 plane at z=-0.65, color 0xede8db. HANDOVER §7.1.
 */
import React from 'react';

export function BackWall() {
  return (
    <mesh position={[0, 1.5, -0.65]}>
      <planeGeometry args={[14, 4]} />
      <meshStandardMaterial color={0xede8db} roughness={1} />
    </mesh>
  );
}
