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
import type { ThreeEvent } from '@/lib/three/r3f';
import { GEOMETRY } from '@/types/ui';
import type { SinkType, FaucetStyle, FaucetFinish } from '@/types/ui';

interface Props {
  xOffset: number;
  width: number;
  worktopTopY: number;
  sinkType: SinkType;
  faucetStyle?: FaucetStyle;
  faucetFinish?: FaucetFinish;
  onPress?: () => void;
  onFaucetPress?: () => void;
}

const { CABINET_DEPTH } = GEOMETRY;

const RIM_COLOR    = 0xc8ccd0;   // brushed stainless steel
const BASIN_COLOR  = 0x2c2c2a;   // dark interior (hole effect)
const DRAIN_COLOR  = 0x8a8e92;
const CHROME_COLOR = 0xbfc4c8;   // faucet body (default chrome)

/** Faucet metal colour by finish. */
const FAUCET_FINISH_COLOR: Record<FaucetFinish, number> = {
  chrome: 0xbfc4c8,
  black:  0x2a2a2c,
  gold:   0xc9a84a,
};

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

/**
 * Faucet — three swappable silhouettes (a per-sink detail):
 *   arch     → tall gooseneck, curved high arc (default)
 *   straight → short column + straight horizontal arm + drop spout (industrial)
 *   pull     → column with a chunky pull-down spray head
 * The whole faucet is one click target → cycles the style.
 */
function Faucet({
  style,
  finish = 'chrome',
  rimY,
  rimD,
  onPress,
}: {
  style: FaucetStyle;
  finish?: FaucetFinish;
  rimY: number;
  rimD: number;
  onPress?: () => void;
}) {
  const backZ = -rimD / 2 + 0.04;
  const baseY = rimY + 0.005;
  const press = onPress
    ? (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onPress(); }
    : undefined;
  const metal = FAUCET_FINISH_COLOR[finish];
  /* gold/black read better slightly less mirror-like than chrome */
  const rough = finish === 'chrome' ? 0.18 : 0.28;
  const chrome = (
    <meshStandardMaterial color={metal} roughness={rough} metalness={0.9} />
  );

  /* Shared base puck + lever handle */
  const base = (
    <>
      <mesh position={[0, baseY, backZ]}>
        <cylinderGeometry args={[0.022, 0.024, 0.012, 16]} />
        {chrome}
      </mesh>
    </>
  );

  if (style === 'straight') {
    const columnH = 0.14;
    const columnY = baseY + columnH / 2;
    const armY = baseY + columnH;
    const armLen = 0.2;
    const spoutZ = backZ + armLen;
    return (
      <group onClick={press}>
        {base}
        {/* short column */}
        <mesh position={[0, columnY, backZ]}>
          <cylinderGeometry args={[0.013, 0.013, columnH, 16]} />{chrome}
        </mesh>
        {/* straight horizontal arm */}
        <mesh position={[0, armY, backZ + armLen / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, armLen, 14]} />{chrome}
        </mesh>
        {/* angled drop spout */}
        <mesh position={[0, armY - 0.03, spoutZ]}>
          <cylinderGeometry args={[0.009, 0.011, 0.07, 14]} />{chrome}
        </mesh>
        {/* lever */}
        <mesh position={[0, columnY + columnH / 2, backZ - 0.03]} rotation={[Math.PI / 2.6, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.06, 10]} />{chrome}
        </mesh>
      </group>
    );
  }

  if (style === 'pull') {
    const columnH = 0.2;
    const columnY = baseY + columnH / 2;
    const headY = baseY + columnH - 0.02;
    const headZ = backZ + 0.06;
    return (
      <group onClick={press}>
        {base}
        {/* column */}
        <mesh position={[0, columnY, backZ]}>
          <cylinderGeometry args={[0.015, 0.015, columnH, 16]} />{chrome}
        </mesh>
        {/* short forward neck */}
        <mesh position={[0, baseY + columnH, backZ + 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.013, 0.013, 0.07, 14]} />{chrome}
        </mesh>
        {/* chunky pull-down spray head (angled down) */}
        <mesh position={[0, headY, headZ]} rotation={[Math.PI / 5, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.022, 0.07, 16]} />{chrome}
        </mesh>
        {/* lever */}
        <mesh position={[0, columnY + columnH / 2 - 0.02, backZ - 0.035]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.006, 0.06, 10]} />{chrome}
        </mesh>
      </group>
    );
  }

  /* arch (default) — tall gooseneck */
  const columnH = 0.22;
  const columnY = baseY + columnH / 2;
  const armLen = 0.16;
  const armY = baseY + columnH;
  const spoutY = armY - 0.04;
  const spoutZ = backZ + armLen - 0.01;
  return (
    <group onClick={press}>
      {base}
      <mesh position={[0, columnY, backZ]}>
        <cylinderGeometry args={[0.014, 0.014, columnH, 16]} />{chrome}
      </mesh>
      <mesh position={[0, columnY + columnH / 2 - 0.02, backZ - 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, 0.06, 10]} />{chrome}
      </mesh>
      <mesh position={[0, armY, backZ + armLen / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, armLen, 14]} />{chrome}
      </mesh>
      <mesh position={[0, armY, backZ + armLen]}>
        <sphereGeometry args={[0.014, 14, 14]} />{chrome}
      </mesh>
      <mesh position={[0, spoutY, spoutZ]}>
        <cylinderGeometry args={[0.009, 0.011, 0.08, 14]} />{chrome}
      </mesh>
      <mesh position={[0, spoutY - 0.05, spoutZ]}>
        <cylinderGeometry args={[0.011, 0.011, 0.006, 14]} />
        <meshStandardMaterial color={DRAIN_COLOR} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

export function Sink({ xOffset, width, worktopTopY, sinkType, faucetStyle = 'arch', faucetFinish = 'chrome', onPress, onFaucetPress }: Props) {
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

      {/* Faucet — swappable silhouette + finish, its own click target */}
      <Faucet style={faucetStyle} finish={faucetFinish} rimY={rimY} rimD={rimD} onPress={onFaucetPress} />
    </group>
  );
}
