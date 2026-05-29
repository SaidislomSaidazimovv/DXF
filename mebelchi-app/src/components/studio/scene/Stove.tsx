/**
 * Stove — glass cooktop with 4 burners (induction rings OR gas grates).
 *
 * Anatomy:
 *   • Black-glass cooktop slab, ~94% of cabinet width, ~440mm deep
 *   • Thin chrome trim around the slab
 *   • 4 burner zones, arranged 2×2
 *     – induction: thin ring outline drawn ON the glass (no protrusion)
 *     – gas:       cup + cross grate above the glass
 *   • Front control strip with 4 small knobs (gas) or 4 touch indicators (induction)
 */
import React from 'react';
import { GEOMETRY } from '@/types/ui';
import type { StoveType } from '@/types/ui';

interface Props {
  xOffset: number;
  width: number;
  worktopTopY: number;
  stoveType: StoveType;
  onPress?: () => void;
}

const { CABINET_DEPTH } = GEOMETRY;

const GLASS_COLOR = 0x0a0a0c;     // black ceramic glass
const GLASS_RING  = 0x4a4a48;     // induction ring outline
const TRIM_COLOR  = 0xbfc4c8;     // chrome trim
const GRATE_COLOR = 0x2a2a28;     // cast iron grates
const BURNER_CUP  = 0x3a3a37;
const KNOB_COLOR  = 0x3a3a37;
const TOUCH_LED   = 0xff8a4a;     // hint of orange for induction touch pad

export function Stove({ xOffset, width, worktopTopY, stoveType, onPress }: Props) {
  if (stoveType === 'none') return null;

  const slabW = Math.min(width * 0.94, 0.66);
  const slabD = 0.44;
  const slabH = 0.012;
  const slabY = worktopTopY + slabH / 2 + 0.001;
  const slabZ = -CABINET_DEPTH / 2 + slabD / 2 + 0.05;

  const burnerR = Math.min(0.075, slabW * 0.18);

  /* 2×2 burner offsets (in slab-local coords, before group translation) */
  const offsets: [number, number][] = [
    [-slabW * 0.26, -slabD * 0.20],   // back-left
    [+slabW * 0.26, -slabD * 0.20],   // back-right
    [-slabW * 0.26, +slabD * 0.20],   // front-left
    [+slabW * 0.26, +slabD * 0.20],   // front-right
  ];

  /* Knob/touch positions on the front edge of the slab */
  const knobZ = slabZ + slabD / 2 - 0.045;
  const knobY = slabY + slabH / 2 + 0.005;
  const knobXs = [-slabW * 0.36, -slabW * 0.12, +slabW * 0.12, +slabW * 0.36];

  return (
    <group position={[xOffset, 0, 0]}>
      {/* Glass slab — click target */}
      <mesh
        position={[0, slabY, slabZ]}
        onClick={onPress ? (e) => { e.stopPropagation(); onPress(); } : undefined}
      >
        <boxGeometry args={[slabW, slabH, slabD]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.18} metalness={0.55} />
      </mesh>

      {/* Chrome trim — thin frame around the slab edge */}
      {/* Front edge */}
      <mesh position={[0, slabY + slabH / 2 + 0.001, slabZ + slabD / 2 - 0.001]}>
        <boxGeometry args={[slabW, 0.002, 0.004]} />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Back edge */}
      <mesh position={[0, slabY + slabH / 2 + 0.001, slabZ - slabD / 2 + 0.001]}>
        <boxGeometry args={[slabW, 0.002, 0.004]} />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Left edge */}
      <mesh position={[-slabW / 2 + 0.001, slabY + slabH / 2 + 0.001, slabZ]}>
        <boxGeometry args={[0.004, 0.002, slabD]} />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Right edge */}
      <mesh position={[+slabW / 2 - 0.001, slabY + slabH / 2 + 0.001, slabZ]}>
        <boxGeometry args={[0.004, 0.002, slabD]} />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.2} metalness={0.85} />
      </mesh>

      {/* Burners */}
      {stoveType === 'induction' && (
        <>
          {offsets.map(([dx, dz], i) => (
            <group key={'ind-' + i} position={[dx, slabY + slabH / 2 + 0.0006, slabZ + dz]}>
              {/* Outer ring */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[burnerR, 0.0016, 8, 32]} />
                <meshStandardMaterial color={GLASS_RING} roughness={0.5} metalness={0.3} />
              </mesh>
              {/* Inner small ring (decorative) */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[burnerR * 0.6, 0.0014, 8, 28]} />
                <meshStandardMaterial color={GLASS_RING} roughness={0.5} metalness={0.3} />
              </mesh>
            </group>
          ))}
          {/* Touch-control LED dots near front */}
          {knobXs.map((x, i) => (
            <mesh key={'led-' + i} position={[x, knobY, knobZ]}>
              <cylinderGeometry args={[0.005, 0.005, 0.001, 10]} />
              <meshBasicMaterial color={TOUCH_LED} />
            </mesh>
          ))}
        </>
      )}

      {stoveType === 'gas' && (
        <>
          {offsets.map(([dx, dz], i) => {
            const baseY = slabY + slabH / 2 + 0.001;
            return (
              <group key={'gas-' + i} position={[dx, baseY, slabZ + dz]}>
                {/* Burner cup */}
                <mesh position={[0, 0.006, 0]}>
                  <cylinderGeometry args={[burnerR * 0.7, burnerR * 0.7, 0.012, 16]} />
                  <meshStandardMaterial color={BURNER_CUP} roughness={0.6} metalness={0.5} />
                </mesh>
                {/* Cross grate (4 arms above the cup) */}
                {[0, Math.PI / 2].map((rot, k) => (
                  <mesh
                    key={k}
                    position={[0, 0.018, 0]}
                    rotation={[0, rot, 0]}
                  >
                    <boxGeometry args={[burnerR * 2.2, 0.006, 0.006]} />
                    <meshStandardMaterial color={GRATE_COLOR} roughness={0.75} metalness={0.4} />
                  </mesh>
                ))}
              </group>
            );
          })}
          {/* Gas knobs at the front */}
          {knobXs.map((x, i) => (
            <mesh
              key={'knob-' + i}
              position={[x, knobY + 0.005, knobZ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.012, 14]} />
              <meshStandardMaterial color={KNOB_COLOR} roughness={0.55} metalness={0.45} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
