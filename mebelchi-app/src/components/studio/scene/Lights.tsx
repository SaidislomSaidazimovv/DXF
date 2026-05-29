/**
 * Scene lighting — HANDOVER §7.1.
 * Warm ambient + warm directional sun + cool blue fill.
 */
import React from 'react';

export function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} color={0xfff5e8} />
      <directionalLight intensity={0.85} position={[2.6, 4.5, 2.8]} color={0xffeacc} />
      <directionalLight intensity={0.18} position={[-3, 2, 2]} color={0xc8d8ff} />
    </>
  );
}
