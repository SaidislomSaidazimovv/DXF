/**
 * ConstraintMarkers3D — renders Phase A constraints as 3D markers in the
 * back wall + floor so the mebelchi sees what the variant generator was
 * working with. Visualizations are deliberately light:
 *   • window     — large outlined rectangle on the back wall + slight blue
 *                  "glass" tint, sits at counter-window height
 *   • door       — vertical outline on the back wall + a quarter-circle
 *                  swing arc on the floor
 *   • gas_line   — small red disc on the floor at the wall
 *   • drain_stack/water_inlet — small blue disc on the floor at the wall
 *   • outlet     — small grey square on the wall ~1.1m above floor
 *   • hood_vent  — small purple square on the wall ~1.7m above floor
 *
 * All markers are pure visual hints — no click handlers. They live behind
 * the cabinets so they don't obstruct interactions.
 *
 * Coordinate mapping: the wall runs along world X. Variant cabinets are
 * laid out so the wall is centred on x=0. We convert Phase A's `xMm`
 * (left-to-right, 0..wallLengthMm) into local x by:
 *     localX = (xMm - wallLengthMm / 2) / 1000
 */
import React from 'react';
import { useUI } from '@/store/uiStore';
import type { Constraint } from '@/types/ui';

const WALL_Z = -0.62;        // just in front of BackWall (-0.65)
const FLOOR_Y = 0.001;       // just above floor

/* Phase D colors — keep visual identity consistent with the Phase A
   palette colour wheel. Hex values match `COLORS.constraint*`. */
const COLOR = {
  window:      0xd4a72c,
  door:        0xc97a3a,
  gas_line:    0xb03a3a,
  drain_stack: 0x2c6fb8,
  water_inlet: 0x2c6fb8,
  outlet:      0x7a7972,
  hood_vent:   0x7a4ab5,
};

function localX(xMm: number, wallMm: number): number {
  return (xMm - wallMm / 2) / 1000;
}

function WindowMarker({ c, wallMm }: { c: Constraint; wallMm: number }) {
  const cx = localX(c.xMm, wallMm);
  const widthM = (c.widthMm ?? 900) / 1000;
  const heightM = 1.1;
  const cy = 1.55;  // window centre Y — about counter-height + window height/2

  return (
    <group position={[cx, cy, WALL_Z]}>
      {/* Glass tint */}
      <mesh>
        <planeGeometry args={[widthM, heightM]} />
        <meshStandardMaterial
          color={0x8fb6d4}
          transparent
          opacity={0.32}
          roughness={0.2}
        />
      </mesh>
      {/* 4 frame edges */}
      <mesh position={[0, +heightM / 2, 0.001]}>
        <boxGeometry args={[widthM + 0.04, 0.025, 0.005]} />
        <meshStandardMaterial color={COLOR.window} />
      </mesh>
      <mesh position={[0, -heightM / 2, 0.001]}>
        <boxGeometry args={[widthM + 0.04, 0.025, 0.005]} />
        <meshStandardMaterial color={COLOR.window} />
      </mesh>
      <mesh position={[-widthM / 2, 0, 0.001]}>
        <boxGeometry args={[0.025, heightM, 0.005]} />
        <meshStandardMaterial color={COLOR.window} />
      </mesh>
      <mesh position={[+widthM / 2, 0, 0.001]}>
        <boxGeometry args={[0.025, heightM, 0.005]} />
        <meshStandardMaterial color={COLOR.window} />
      </mesh>
      {/* Cross mullion */}
      <mesh position={[0, 0, 0.001]}>
        <boxGeometry args={[widthM, 0.012, 0.003]} />
        <meshStandardMaterial color={COLOR.window} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <boxGeometry args={[0.012, heightM, 0.003]} />
        <meshStandardMaterial color={COLOR.window} />
      </mesh>
    </group>
  );
}

function DoorMarker({ c, wallMm }: { c: Constraint; wallMm: number }) {
  const cx = localX(c.xMm, wallMm);
  const widthM = (c.widthMm ?? 800) / 1000;
  const heightM = 2.05;
  const cy = heightM / 2 + 0.02;
  const swingRight = c.swingSide === 'right';

  /* Swing arc — render as 12 small dots forming a quarter-circle on the floor */
  const dots = Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    const ang = (Math.PI / 2) * t;
    const r = widthM;
    const dx = swingRight ? +Math.sin(ang) * r : -Math.sin(ang) * r;
    const dz = +Math.cos(ang) * r - r;  // arc curves inward from wall
    return [dx, dz] as [number, number];
  });

  return (
    <group position={[cx, 0, WALL_Z]}>
      {/* Door panel outline on the wall (suggestive — not a real door panel) */}
      <mesh position={[0, cy, 0.001]}>
        <planeGeometry args={[widthM, heightM]} />
        <meshStandardMaterial
          color={COLOR.door}
          transparent
          opacity={0.16}
        />
      </mesh>
      {/* Frame outline */}
      <mesh position={[-widthM / 2, cy, 0.002]}>
        <boxGeometry args={[0.02, heightM, 0.004]} />
        <meshStandardMaterial color={COLOR.door} />
      </mesh>
      <mesh position={[+widthM / 2, cy, 0.002]}>
        <boxGeometry args={[0.02, heightM, 0.004]} />
        <meshStandardMaterial color={COLOR.door} />
      </mesh>
      <mesh position={[0, heightM + 0.02, 0.002]}>
        <boxGeometry args={[widthM + 0.04, 0.02, 0.004]} />
        <meshStandardMaterial color={COLOR.door} />
      </mesh>

      {/* Swing arc on floor */}
      {dots.map(([dx, dz], i) => (
        <mesh key={i} position={[dx, FLOOR_Y, WALL_Z + dz]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color={COLOR.door} />
        </mesh>
      ))}
    </group>
  );
}

function FloorPuck({
  cx,
  color,
  label,
}: { cx: number; color: number; label?: string }) {
  return (
    <group position={[cx, FLOOR_Y, WALL_Z + 0.04]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.008, 18]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.004, 12]} />
        <meshStandardMaterial color={0xffffff} />
      </mesh>
    </group>
  );
}

function WallPatch({
  cx,
  cy,
  color,
}: { cx: number; cy: number; color: number }) {
  return (
    <group position={[cx, cy, WALL_Z + 0.003]}>
      <mesh>
        <boxGeometry args={[0.07, 0.045, 0.005]} />
        <meshStandardMaterial color={0xefe9d8} />
      </mesh>
      <mesh position={[0, 0, 0.003]}>
        <boxGeometry args={[0.05, 0.025, 0.003]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export function ConstraintMarkers3D() {
  const constraints = useUI((s) => s.constraints);
  const wallMm = useUI((s) => s.wallLengthMm);

  if (constraints.length === 0) return null;

  return (
    <group>
      {constraints.map((c) => {
        const cx = localX(c.xMm, wallMm);
        if (c.type === 'window')      return <WindowMarker key={c.id} c={c} wallMm={wallMm} />;
        if (c.type === 'door')        return <DoorMarker   key={c.id} c={c} wallMm={wallMm} />;
        if (c.type === 'gas_line')    return <FloorPuck    key={c.id} cx={cx} color={COLOR.gas_line} />;
        if (c.type === 'drain_stack') return <FloorPuck    key={c.id} cx={cx} color={COLOR.drain_stack} />;
        if (c.type === 'water_inlet') return <FloorPuck    key={c.id} cx={cx} color={COLOR.water_inlet} />;
        if (c.type === 'outlet')      return <WallPatch    key={c.id} cx={cx} cy={1.1} color={COLOR.outlet} />;
        if (c.type === 'hood_vent')   return <WallPatch    key={c.id} cx={cx} cy={1.95} color={COLOR.hood_vent} />;
        return null;
      })}
    </group>
  );
}
