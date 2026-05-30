/**
 * DoorFront — realistic cabinet door(s).
 *
 * Instead of drawing lines on the carcass front face, this renders the door
 * as a real panel standing PROUD of the carcass, with a reveal gap all around
 * (and between double doors) backed by a dark shadow plane — exactly how a
 * mounted cabinet door reads in real life.
 *
 * Per door it applies the chosen style:
 *   flat     — plain slab
 *   shaker   — recessed centre panel ringed by a shadow groove
 *   grooved  — three recessed horizontal channels
 *   glass    — aluminium frame + tinted glass insert
 *
 * Handles ride on the proud door, near the inner-top corner.
 */
import React from 'react';
import type { ThreeEvent } from '@/lib/three/r3f';
import type { DoorStyle, HandleType } from '@/types/ui';
import { Handle } from './Handle';
import { FRONT } from './constants';

interface Props {
  bodyW: number;
  bodyHeight: number;
  bodyY: number;
  facadeColor: number;
  lineCol: number;
  accent: number;
  style: DoorStyle;
  handle: HandleType;
  isWide: boolean;
  onSelect: () => void;
}

const REVEAL = 0.006;          // gap around each door (m)
const PANEL_T = 0.018;         // door thickness (m)
const DOOR_Z = FRONT + 0.006;  // door front sits proud of the carcass
const SHADOW = 0x1a1714;       // reveal/recess shadow colour

function press(onSelect: () => void) {
  return (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(); };
}

/** One door panel centred at xc, with its style detail + handle. */
function Door({
  xc, w, h, yc, facadeColor, lineCol, accent, style, handle, handleSide, onSelect,
}: {
  xc: number; w: number; h: number; yc: number;
  facadeColor: number; lineCol: number; accent: number;
  style: DoorStyle; handle: HandleType; handleSide: 1 | -1; onSelect: () => void;
}) {
  const tap = press(onSelect);
  const frontZ = DOOR_Z + PANEL_T / 2;

  return (
    <group position={[xc, 0, 0]}>
      {/* The slab */}
      <mesh position={[0, yc, DOOR_Z]} onClick={tap}>
        <boxGeometry args={[w, h, PANEL_T]} />
        <meshStandardMaterial color={facadeColor} roughness={0.5} metalness={0.04} />
      </mesh>

      {/* ── Shaker: recessed centre panel + shadow rim ── */}
      {style === 'shaker' && (() => {
        const inset = 0.06;
        const pw = w - inset * 2;
        const ph = h - inset * 2;
        const rim = 0.006;
        const sh = <meshStandardMaterial color={lineCol} transparent opacity={0.45} />;
        return (
          <group>
            <mesh position={[0, yc, frontZ - 0.006]}>
              <boxGeometry args={[pw, ph, 0.004]} />
              <meshStandardMaterial color={facadeColor} roughness={0.55} />
            </mesh>
            <mesh position={[0, yc + ph / 2 + rim / 2, frontZ - 0.002]}><boxGeometry args={[pw + rim * 2, rim, 0.002]} />{sh}</mesh>
            <mesh position={[0, yc - ph / 2 - rim / 2, frontZ - 0.002]}><boxGeometry args={[pw + rim * 2, rim, 0.002]} />{sh}</mesh>
            <mesh position={[-pw / 2 - rim / 2, yc, frontZ - 0.002]}><boxGeometry args={[rim, ph, 0.002]} />{sh}</mesh>
            <mesh position={[pw / 2 + rim / 2, yc, frontZ - 0.002]}><boxGeometry args={[rim, ph, 0.002]} />{sh}</mesh>
          </group>
        );
      })()}

      {/* ── Grooved: 3 recessed horizontal channels ── */}
      {style === 'grooved' && [0, 1, 2].map((k) => {
        const gy = yc - h / 2 + h * (0.3 + k * 0.2);
        return (
          <mesh key={k} position={[0, gy, frontZ - 0.004]}>
            <boxGeometry args={[w - 0.06, 0.012, 0.004]} />
            <meshStandardMaterial color={SHADOW} roughness={0.85} />
          </mesh>
        );
      })}

      {/* ── Glass: aluminium frame + tinted glass ── */}
      {style === 'glass' && (() => {
        const inset = 0.045;
        const gw = w - inset * 2;
        const gh = h - inset * 2;
        const fr = 0.012;
        const chrome = <meshStandardMaterial color={0xb9bec2} roughness={0.3} metalness={0.85} />;
        return (
          <group>
            <mesh position={[0, yc, frontZ + 0.002]}>
              <boxGeometry args={[gw, gh, 0.003]} />
              <meshStandardMaterial color={0x20262b} transparent opacity={0.55} roughness={0.12} metalness={0.4} />
            </mesh>
            <mesh position={[0, yc + gh / 2 + fr / 2, frontZ + 0.003]}><boxGeometry args={[gw + fr * 2, fr, 0.006]} />{chrome}</mesh>
            <mesh position={[0, yc - gh / 2 - fr / 2, frontZ + 0.003]}><boxGeometry args={[gw + fr * 2, fr, 0.006]} />{chrome}</mesh>
            <mesh position={[-gw / 2 - fr / 2, yc, frontZ + 0.003]}><boxGeometry args={[fr, gh, 0.006]} />{chrome}</mesh>
            <mesh position={[gw / 2 + fr / 2, yc, frontZ + 0.003]}><boxGeometry args={[fr, gh, 0.006]} />{chrome}</mesh>
          </group>
        );
      })()}

      {/* ── Slat: vertical recessed grooves ── */}
      {style === 'slat' && [-0.3, -0.1, 0.1, 0.3].map((fx, k) => (
        <mesh key={k} position={[w * fx, yc, frontZ - 0.004]}>
          <boxGeometry args={[0.01, h - 0.06, 0.004]} />
          <meshStandardMaterial color={SHADOW} roughness={0.85} />
        </mesh>
      ))}

      {/* ── Profile: double-framed routed panel (deeper than shaker) ── */}
      {style === 'profile' && (() => {
        const rim = 0.006;
        const insets = [0.05, 0.085];   // two concentric frames
        return (
          <group>
            <mesh position={[0, yc, frontZ - 0.008]}>
              <boxGeometry args={[w - insets[1] * 2, h - insets[1] * 2, 0.004]} />
              <meshStandardMaterial color={facadeColor} roughness={0.58} />
            </mesh>
            {insets.map((ins, fi) => {
              const pw = w - ins * 2;
              const ph = h - ins * 2;
              const sh = <meshStandardMaterial color={lineCol} transparent opacity={fi === 0 ? 0.35 : 0.5} />;
              return (
                <group key={fi}>
                  <mesh position={[0, yc + ph / 2, frontZ - 0.002]}><boxGeometry args={[pw + rim, rim * 0.7, 0.002]} />{sh}</mesh>
                  <mesh position={[0, yc - ph / 2, frontZ - 0.002]}><boxGeometry args={[pw + rim, rim * 0.7, 0.002]} />{sh}</mesh>
                  <mesh position={[-pw / 2, yc, frontZ - 0.002]}><boxGeometry args={[rim * 0.7, ph, 0.002]} />{sh}</mesh>
                  <mesh position={[pw / 2, yc, frontZ - 0.002]}><boxGeometry args={[rim * 0.7, ph, 0.002]} />{sh}</mesh>
                </group>
              );
            })}
          </group>
        );
      })()}

      {/* Handle — near the inner-top corner (vertical bar reads like a real pull) */}
      <Handle
        type={handle}
        x={handleSide * (w / 2 - 0.03)}
        y={yc + h / 2 - 0.12}
        frontZ={frontZ}
        panelWidth={w}
        orientation="vertical"
        accent={accent}
        onPress={onSelect}
      />
    </group>
  );
}

export function DoorFront({
  bodyW, bodyHeight, bodyY, facadeColor, lineCol, accent, style, handle, isWide, onSelect,
}: Props) {
  const doorH = bodyHeight - REVEAL * 2;

  return (
    <group>
      {/* Dark backing plane — shows through the reveal gaps as shadow */}
      <mesh position={[0, bodyY, FRONT + 0.001]}>
        <boxGeometry args={[bodyW - 0.004, bodyHeight - 0.004, 0.002]} />
        <meshStandardMaterial color={SHADOW} roughness={0.9} />
      </mesh>

      {isWide ? (
        (() => {
          const doorW = (bodyW - REVEAL * 3) / 2;   // outer reveals + centre gap
          const cx = doorW / 2 + REVEAL / 2;
          return (
            <>
              <Door xc={-cx} w={doorW} h={doorH} yc={bodyY} facadeColor={facadeColor}
                lineCol={lineCol} accent={accent} style={style} handle={handle} handleSide={1} onSelect={onSelect} />
              <Door xc={+cx} w={doorW} h={doorH} yc={bodyY} facadeColor={facadeColor}
                lineCol={lineCol} accent={accent} style={style} handle={handle} handleSide={-1} onSelect={onSelect} />
            </>
          );
        })()
      ) : (
        <Door xc={0} w={bodyW - REVEAL * 2} h={doorH} yc={bodyY} facadeColor={facadeColor}
          lineCol={lineCol} accent={accent} style={style} handle={handle} handleSide={1} onSelect={onSelect} />
      )}
    </group>
  );
}
