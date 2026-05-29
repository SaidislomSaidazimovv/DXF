/**
 * Upper — wall-hung cabinet above a base cabinet.
 *
 * Mirrors the base cabinet below it: same facade colour, same handle
 * style, and a centre divider (two doors) when wide. Handle + shadow
 * colour pick contrast against the facade.
 */
import React from 'react';
import type { ThreeEvent } from '@/lib/three/r3f';
import { GEOMETRY } from '@/types/ui';
import type { HandleType } from '@/types/ui';
import { accentForFacade, lineForFacade } from '@/lib/colors';
import { Handle } from './cabinet/Handle';

interface Props {
  position: [number, number, number];
  width: number;
  facadeColor: number;
  handle?: HandleType;
  hasHandle?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onCycleHandle?: () => void;
}

const { UPPER_HEIGHT, UPPER_DEPTH, UPPER_Y_OFFSET, CABINET_DEPTH } = GEOMETRY;

const DOUBLE_DOOR_W = 0.55;
const HIGHLIGHT_COLOR = 0x1d6fb8;

export function Upper({
  position,
  width,
  facadeColor,
  handle = 'bar',
  hasHandle = true,
  isSelected = false,
  onSelect,
  onCycleHandle,
}: Props) {
  const bodyW = width - 0.003;
  const cy = UPPER_Y_OFFSET + UPPER_HEIGHT / 2;
  const baseBackZ = position[2] - CABINET_DEPTH / 2;
  const upperCenterZ = baseBackZ + UPPER_DEPTH / 2;
  const accent = accentForFacade(facadeColor);
  const lineCol = lineForFacade(facadeColor);
  const frontZ = UPPER_DEPTH / 2;
  const isWide = bodyW > DOUBLE_DOOR_W;

  /* Tapping an upper just selects it — handle/colour are changed in the pill. */
  const onBodyClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect?.();
  };
  const handlePress = () => onSelect?.();

  return (
    <group position={[position[0], 0, upperCenterZ]}>
      <mesh position={[0, cy, 0]} onClick={onBodyClick}>
        <boxGeometry args={[bodyW, UPPER_HEIGHT, UPPER_DEPTH]} />
        <meshStandardMaterial color={facadeColor} roughness={0.6} />
      </mesh>

      {/* Centre divider for double-door uppers */}
      {isWide && (
        <mesh position={[0, cy, frontZ]}>
          <boxGeometry args={[0.003, UPPER_HEIGHT - 0.04, 0.002]} />
          <meshStandardMaterial color={lineCol} transparent opacity={0.22} />
        </mesh>
      )}

      {/* Bottom shadow strip */}
      <mesh position={[0, cy - UPPER_HEIGHT / 2 + 0.003, frontZ + 0.001]}>
        <boxGeometry args={[bodyW - 0.01, 0.006, 0.002]} />
        <meshStandardMaterial color={lineCol} transparent opacity={0.18} />
      </mesh>

      {/* Handle(s) near the bottom edge — one per door, matching base style */}
      {hasHandle && (
        isWide ? (
          <>
            <Handle
              type={handle}
              x={-bodyW / 4}
              y={cy - UPPER_HEIGHT / 2 + 0.05}
              frontZ={frontZ}
              panelWidth={bodyW / 2}
              orientation="horizontal"
              accent={accent}
              onPress={handlePress}
            />
            <Handle
              type={handle}
              x={+bodyW / 4}
              y={cy - UPPER_HEIGHT / 2 + 0.05}
              frontZ={frontZ}
              panelWidth={bodyW / 2}
              orientation="horizontal"
              accent={accent}
              onPress={handlePress}
            />
          </>
        ) : (
          <Handle
            type={handle}
            x={0}
            y={cy - UPPER_HEIGHT / 2 + 0.05}
            frontZ={frontZ}
            panelWidth={bodyW}
            orientation="horizontal"
            accent={accent}
            onPress={handlePress}
          />
        )
      )}

      {/* Selection highlight — blue translucent box when this upper is focused */}
      {isSelected && (
        <mesh position={[0, cy, 0]}>
          <boxGeometry args={[bodyW + 0.04, UPPER_HEIGHT + 0.05, UPPER_DEPTH + 0.05]} />
          <meshStandardMaterial
            color={HIGHLIGHT_COLOR}
            transparent
            opacity={0.16}
            roughness={0.4}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
