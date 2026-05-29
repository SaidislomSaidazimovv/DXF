/**
 * Sink — stainless-steel rim with a real recessed basin + arched faucet.
 *
 * Anatomy (single):
 *   • Rim plate (light steel, flush with worktop)
 *   • Basin floor inset ~80mm below rim (dark hole effect)
 *   • Inner walls — 4 thin chrome boxes connecting rim to floor
 *   • Drain disc in centre
 *   • Faucet: vertical chrome column (taller, behind basin) +
 *     arched/curved horizontal arm going forward + vertical drop spout
 *     ending above basin centre
 *
 * Double: two basins side-by-side + divider rim + single faucet centred
 *         on the rim seam.
 */
import React from 'react';
import { GEOMETRY } from '@/types/ui';
import type { SinkType } from '@/types/ui';

interface Props {
  xOffset: number;
  width: number;
  worktopTopY: number;
  sinkType: SinkType;
  onPress?: () => void;
}

const { CABINET_DEPTH } = GEOMETRY;

const RIM_COLOR    = 0xc8ccd0;   // brushed stainless steel
const BASIN_COLOR  = 0x2c2c2a;   // dark interior (hole effect)
const DRAIN_COLOR  = 0x8a8e92;
const CHROME_COLOR = 0xbfc4c8;   // faucet body

function SingleBasin({
  cx, basinW, basinD, rimY, rimThickness, depth,
}: { cx: number; basinW: number; basinD: number; rimY: number; rimThickness: number; depth: number }) {
  /* Basin interior is rimY - depth (Y of basin floor) */
  const innerW = basinW - 0.04;
  const innerD = basinD - 0.04;
  const floorY = rimY - depth;
  const wallY  = rimY - depth / 2;
  const wallT  = 0.006;

  return (
    <group position={[cx, 0, 0]}>
      {/* Basin floor (dark) */}
      <mesh position={[0, floorY, 0]}>
        <boxGeometry args={[innerW, 0.004, innerD]} />
        <meshStandardMaterial color={BASIN_COLOR} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* 4 inner walls — chrome */}
      <mesh position={[-innerW / 2 + wallT / 2, wallY, 0]}>
        <boxGeometry args={[wallT, depth, innerD]} />
        <meshStandardMaterial color={CHROME_COLOR} roughness={0.25} metalness={0.7} />
      </mesh>
      <mesh position={[+innerW / 2 - wallT / 2, wallY, 0]}>
        <boxGeometry args={[wallT, depth, innerD]} />
        <meshStandardMaterial color={CHROME_COLOR} roughness={0.25} metalness={0.7} />
      </mesh>
      <mesh position={[0, wallY, -innerD / 2 + wallT / 2]}>
        <boxGeometry args={[innerW, depth, wallT]} />
        <meshStandardMaterial color={CHROME_COLOR} roughness={0.25} metalness={0.7} />
      </mesh>
      <mesh position={[0, wallY, +innerD / 2 - wallT / 2]}>
        <boxGeometry args={[innerW, depth, wallT]} />
        <meshStandardMaterial color={CHROME_COLOR} roughness={0.25} metalness={0.7} />
      </mesh>

      {/* Drain — small disc in centre */}
      <mesh position={[0, floorY + 0.003, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.002, 16]} />
        <meshStandardMaterial color={DRAIN_COLOR} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, floorY + 0.0045, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.001, 16]} />
        <meshStandardMaterial color={BASIN_COLOR} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Sink({ xOffset, width, worktopTopY, sinkType, onPress }: Props) {
  if (sinkType === 'none') return null;

  const rimW = Math.min(width * 0.88, 0.62);
  const rimD = 0.42;
  const rimThickness = 0.006;
  const rimY = worktopTopY + rimThickness / 2 + 0.001;
  const sinkZ = -CABINET_DEPTH / 2 + rimD / 2 + 0.06; // toward front, leaving room for faucet
  const basinDepth = 0.08;

  /* For double-sink we split rimW into 2 basins around a small divider */
  const basinW = sinkType === 'double' ? (rimW - 0.012) / 2 : rimW - 0.012;
  const basinD = rimD - 0.012;

  return (
    <group position={[xOffset, 0, sinkZ]}>
      {/* Rim plate — large, click target */}
      <mesh
        position={[0, rimY, 0]}
        onClick={onPress ? (e) => { e.stopPropagation(); onPress(); } : undefined}
      >
        <boxGeometry args={[rimW, rimThickness, rimD]} />
        <meshStandardMaterial color={RIM_COLOR} roughness={0.25} metalness={0.75} />
      </mesh>

      {/* Basin(s) — recessed */}
      {sinkType === 'single' && (
        <SingleBasin
          cx={0}
          basinW={basinW}
          basinD={basinD}
          rimY={rimY}
          rimThickness={rimThickness}
          depth={basinDepth}
        />
      )}
      {sinkType === 'double' && (
        <>
          <SingleBasin
            cx={-(basinW / 2 + 0.006)}
            basinW={basinW}
            basinD={basinD}
            rimY={rimY}
            rimThickness={rimThickness}
            depth={basinDepth}
          />
          <SingleBasin
            cx={+(basinW / 2 + 0.006)}
            basinW={basinW}
            basinD={basinD}
            rimY={rimY}
            rimThickness={rimThickness}
            depth={basinDepth}
          />
          {/* Divider strip on rim */}
          <mesh position={[0, rimY + 0.0015, 0]}>
            <boxGeometry args={[0.008, 0.003, basinD]} />
            <meshStandardMaterial color={RIM_COLOR} roughness={0.3} metalness={0.7} />
          </mesh>
        </>
      )}

      {/* ── Faucet ──────────────────────────────────────────────
         Anatomy:
         (1) base puck on the back rim
         (2) vertical chrome column ~220mm tall
         (3) curved arm = short forward box then quarter-arc down
         (4) spout — short vertical chrome tube above basin centre
      */}
      {(() => {
        const faucetBackZ = -rimD / 2 + 0.04;       // base puck z (behind basins)
        const baseY = rimY + 0.005;
        const columnH = 0.22;
        const columnY = baseY + columnH / 2;
        const armLen = 0.16;                         // forward reach
        const armY = baseY + columnH;
        const spoutY = armY - 0.04;                  // spout drops 40mm
        const spoutZ = faucetBackZ + armLen - 0.01;  // tip in front of column

        return (
          <group>
            {/* (1) Base puck */}
            <mesh position={[0, baseY, faucetBackZ]}>
              <cylinderGeometry args={[0.022, 0.024, 0.012, 16]} />
              <meshStandardMaterial color={CHROME_COLOR} roughness={0.2} metalness={0.85} />
            </mesh>
            {/* (2) Vertical column */}
            <mesh position={[0, columnY, faucetBackZ]}>
              <cylinderGeometry args={[0.014, 0.014, columnH, 16]} />
              <meshStandardMaterial color={CHROME_COLOR} roughness={0.18} metalness={0.9} />
            </mesh>
            {/* Handle (small lever near top of column) */}
            <mesh
              position={[0, columnY + columnH / 2 - 0.02, faucetBackZ - 0.04]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.006, 0.006, 0.06, 10]} />
              <meshStandardMaterial color={CHROME_COLOR} roughness={0.2} metalness={0.9} />
            </mesh>
            {/* (3) Horizontal arm (forward) */}
            <mesh
              position={[0, armY, faucetBackZ + armLen / 2]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.011, 0.011, armLen, 14]} />
              <meshStandardMaterial color={CHROME_COLOR} roughness={0.18} metalness={0.9} />
            </mesh>
            {/* Elbow (small sphere at the bend) */}
            <mesh position={[0, armY, faucetBackZ + armLen]}>
              <sphereGeometry args={[0.014, 14, 14]} />
              <meshStandardMaterial color={CHROME_COLOR} roughness={0.18} metalness={0.9} />
            </mesh>
            {/* (4) Spout — short tube dropping down */}
            <mesh position={[0, spoutY, spoutZ]}>
              <cylinderGeometry args={[0.009, 0.011, 0.08, 14]} />
              <meshStandardMaterial color={CHROME_COLOR} roughness={0.18} metalness={0.9} />
            </mesh>
            {/* Aerator tip */}
            <mesh position={[0, spoutY - 0.05, spoutZ]}>
              <cylinderGeometry args={[0.011, 0.011, 0.006, 14]} />
              <meshStandardMaterial color={DRAIN_COLOR} roughness={0.3} metalness={0.8} />
            </mesh>
          </group>
        );
      })()}
    </group>
  );
}
