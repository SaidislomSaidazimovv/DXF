/**
 * Cabinet — Day 4 with interactivity.
 *
 * Tap routing (matches HANDOVER §3.2):
 *   - Body front face  → selected ? cycleDoor : select
 *   - Body sides / top → select
 *   - Plinth           → select
 *   - Handle           → selected ? cycleHandle : select
 *   - Sink basin       → cycleSink (global)
 *   - Stove cooktop    → cycleStove (global)
 *
 * Plus: blue 16% opacity highlight box when isSelected.
 */
import React from 'react';
import type { ThreeEvent } from '@/lib/three/r3f';
import type {
  Cabinet as CabinetData,
  BurnerCount,
  DoorStyle,
  FaucetStyle,
  FaucetFinish,
  HandleType,
  SinkType,
  StoveType,
  ViewMode,
} from '@/types/ui';
import { GEOMETRY } from '@/types/ui';
import { accentForFacade, lineForFacade } from '@/lib/colors';
import { Sink } from './Sink';
import { Stove } from './Stove';
import { DrawerStack } from './cabinet/DrawerStack';
import { useUI } from '@/store/uiStore';

interface Props {
  cabinet: CabinetData;
  position: [number, number, number];
  facadeColor: number;
  doorStyle: DoorStyle;
  handle: HandleType;
  sinkType: SinkType;
  stoveType: StoveType;
  faucetStyle: FaucetStyle;
  faucetFinish: FaucetFinish;
  burners: BurnerCount;
  isSelected: boolean;
  /** Tap a cabinet → just select it (no auto-change; edits happen in the pill). */
  onSelect: () => void;
  /** Tap a fixture → select the cabinet AND zoom to that fixture. */
  onFocusDetail: (detail: 'faucet' | 'stove' | 'sink') => void;
}

const { CABINET_HEIGHT, CABINET_DEPTH, PLINTH_HEIGHT, TALL_HEIGHT, WORKTOP_THICKNESS } = GEOMETRY;
const D2 = CABINET_DEPTH / 2;
const FRONT = D2 + 0.001;
const DOUBLE_DOOR_W = 0.55;
const HIGHLIGHT_COLOR = 0x1d6fb8;

/* Phase-D X-ray palette */
const DRILL_COLOR = 0xc8302d;   // red — drill marks (32mm system)
const HINGE_COLOR = 0x2d9a4a;   // green — hinge cup positions
const SLIDE_COLOR = 0x9a9a99;   // grey — drawer slide rails
const CARCASS_COLOR = 0xd6cfbf; // light LDSP edge tint
const BENCHMARK_OK = 0x2d7a4f;  // green status dot (V1 stub — always green)

/**
 * XrayOverlay — drill marks (32mm system) + hinge cups on side panels,
 * drawer slide indicators inside the carcass.
 *
 * `cupEdgeOffsetMm` is the distance from the front edge of the side panel
 * to the centre of the hinge cup column. Per HANDOVER catalogue:
 *   Blum    → 5mm (full overlay)
 *   Hettich → 5mm (full overlay)
 *   Boyard  → 6mm (full overlay)
 *
 * Changing the hinge brand in Phase D moves this column visibly — that's
 * what the X-ray view is for.
 */
function XrayOverlay({
  bodyW,
  bodyHeight,
  bodyY,
  isDrawer,
  drawerCount,
  hasDoor,
  cupEdgeOffsetMm,
}: {
  bodyW: number;
  bodyHeight: number;
  bodyY: number;
  isDrawer: boolean;
  drawerCount: number;
  hasDoor: boolean;
  cupEdgeOffsetMm: number;
}) {
  /* 32-mm-system drill column: dots at every 32mm from 64mm up to bodyHeight-64.
     Two columns per side panel (front + back edge of side).
     Front column shifts with the brand-specific cup edge offset. */
  const cupOffsetM = cupEdgeOffsetMm / 1000;
  const colOffsetFront = -D2 + cupOffsetM + 0.032;
  const colOffsetBack  = +D2 - 0.037;
  const dotRadius = 0.006;
  const sideX = bodyW / 2 - 0.0085;

  const yStart = bodyY - bodyHeight / 2 + 0.064;
  const yEnd   = bodyY + bodyHeight / 2 - 0.064;
  const drillDots: { y: number }[] = [];
  for (let y = yStart; y <= yEnd; y += 0.032) {
    drillDots.push({ y });
  }

  /* Hinge cups: 2 per door (top + bottom, 95mm from edge) — only when hasDoor */
  const hingeYs = hasDoor
    ? [bodyY + bodyHeight / 2 - 0.095, bodyY - bodyHeight / 2 + 0.095]
    : [];

  /* Drawer slide rails: 1 pair per drawer level */
  const slideYs: number[] = isDrawer
    ? Array.from({ length: drawerCount }, (_, k) =>
        PLINTH_HEIGHT + (CABINET_HEIGHT * (k + 0.5)) / drawerCount
      )
    : [];

  return (
    <group>
      {/* Side panels — render as semi-transparent carcass plates so drilling
          marks read against material */}
      {[-sideX, +sideX].map((sx, side) => (
        <mesh key={'side' + side} position={[sx, bodyY, 0]}>
          <boxGeometry args={[0.016, bodyHeight - 0.002, CABINET_DEPTH - 0.01]} />
          <meshStandardMaterial color={CARCASS_COLOR} transparent opacity={0.35} />
        </mesh>
      ))}
      {/* Top + bottom */}
      <mesh position={[0, bodyY + bodyHeight / 2 - 0.008, 0]}>
        <boxGeometry args={[bodyW - 0.02, 0.016, CABINET_DEPTH - 0.01]} />
        <meshStandardMaterial color={CARCASS_COLOR} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, bodyY - bodyHeight / 2 + 0.008, 0]}>
        <boxGeometry args={[bodyW - 0.02, 0.016, CABINET_DEPTH - 0.01]} />
        <meshStandardMaterial color={CARCASS_COLOR} transparent opacity={0.35} />
      </mesh>

      {/* Drill dots — both columns, both sides */}
      {[-sideX, +sideX].map((sx) =>
        [colOffsetFront, colOffsetBack].map((zOff) =>
          drillDots.map((d, di) => (
            <mesh
              key={`drill-${sx.toFixed(3)}-${zOff.toFixed(3)}-${di}`}
              position={[sx, d.y, zOff]}
            >
              <sphereGeometry args={[dotRadius, 6, 6]} />
              <meshBasicMaterial color={DRILL_COLOR} />
            </mesh>
          ))
        )
      )}

      {/* Hinge cups (green discs on inner side faces, near front edge) */}
      {[-sideX, +sideX].map((sx) =>
        hingeYs.map((hy, hi) => (
          <mesh
            key={`hinge-${sx.toFixed(3)}-${hi}`}
            position={[sx, hy, colOffsetFront]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.004, 14]} />
            <meshBasicMaterial color={HINGE_COLOR} transparent opacity={0.85} />
          </mesh>
        ))
      )}

      {/* Drawer slide rails (grey bars on inner sides) */}
      {[-sideX, +sideX].map((sx) =>
        slideYs.map((sy, si) => (
          <mesh key={`slide-${sx.toFixed(3)}-${si}`} position={[sx, sy, 0]}>
            <boxGeometry args={[0.005, 0.012, CABINET_DEPTH - 0.06]} />
            <meshBasicMaterial color={SLIDE_COLOR} />
          </mesh>
        ))
      )}
    </group>
  );
}

function stopAnd(cb: () => void) {
  return (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    cb();
  };
}

// ── Sub-renderers ─────────────────────────────────────────────

function ShakerFrame({
  bodyW, bodyHeight, bodyY, lineCol,
}: { bodyW: number; bodyHeight: number; bodyY: number; lineCol: number }) {
  const inset = 0.06;
  const frameW = bodyW - inset * 2;
  const frameH = bodyHeight - inset * 2;
  const t = 0.008;
  const mat = <meshStandardMaterial color={lineCol} transparent opacity={0.28} />;
  return (
    <>
      <mesh position={[0, bodyY + frameH / 2 - t / 2, FRONT + 0.001]}>
        <boxGeometry args={[frameW, t, 0.002]} />
        {mat}
      </mesh>
      <mesh position={[0, bodyY - frameH / 2 + t / 2, FRONT + 0.001]}>
        <boxGeometry args={[frameW, t, 0.002]} />
        {mat}
      </mesh>
      <mesh position={[-frameW / 2 + t / 2, bodyY, FRONT + 0.001]}>
        <boxGeometry args={[t, frameH, 0.002]} />
        {mat}
      </mesh>
      <mesh position={[frameW / 2 - t / 2, bodyY, FRONT + 0.001]}>
        <boxGeometry args={[t, frameH, 0.002]} />
        {mat}
      </mesh>
    </>
  );
}

function Grooves({
  bodyW, bodyHeight, bodyY, lineCol,
}: { bodyW: number; bodyHeight: number; bodyY: number; lineCol: number }) {
  const grooveW = bodyW - 0.08;
  const startY = bodyY - bodyHeight / 2 + 0.18;
  return (
    <>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0, startY + k * 0.16, FRONT + 0.001]}>
          <boxGeometry args={[grooveW, 0.004, 0.002]} />
          <meshStandardMaterial color={lineCol} transparent opacity={0.22} />
        </mesh>
      ))}
    </>
  );
}

function DoorHandle({
  xCenter,
  bodyY,
  bodyHeight,
  doorWidth,
  type,
  onPress,
  accent,
}: {
  xCenter: number;
  bodyY: number;
  bodyHeight: number;
  doorWidth: number;
  type: HandleType;
  onPress: () => void;
  accent: number;
}) {
  const handleY = bodyY + bodyHeight / 2 - 0.12;
  const press = stopAnd(onPress);

  if (type === 'knob') {
    return (
      <mesh
        position={[xCenter, handleY, FRONT + 0.011]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={press}
      >
        <cylinderGeometry args={[0.014, 0.014, 0.018, 14]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.55} />
      </mesh>
    );
  }
  if (type === 'inset') {
    return (
      <mesh
        position={[xCenter + doorWidth / 2 - 0.012, bodyY, FRONT + 0.001]}
        onClick={press}
      >
        <boxGeometry args={[0.004, Math.min(0.12, bodyHeight * 0.25), 0.003]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.4} />
      </mesh>
    );
  }
  const len = Math.min(0.14, doorWidth * 0.45);
  return (
    <mesh position={[xCenter, handleY, FRONT + 0.011]} onClick={press}>
      <boxGeometry args={[len, 0.008, 0.012]} />
      <meshStandardMaterial color={accent} roughness={0.3} metalness={0.55} />
    </mesh>
  );
}

function FridgeHandle({ bodyW, bodyHeight, onPress }: { bodyW: number; bodyHeight: number; onPress: () => void }) {
  return (
    <mesh
      position={[bodyW / 2 - 0.06, bodyHeight * 0.55, FRONT + 0.011]}
      onClick={stopAnd(onPress)}
    >
      <boxGeometry args={[0.016, bodyHeight * 0.5, 0.022]} />
      <meshStandardMaterial color={0x2c2c2a} roughness={0.28} metalness={0.65} />
    </mesh>
  );
}

/**
 * OvenFront — the facade of a stove cabinet looks like an oven door:
 *   • Top: thin control strip with 4 small knobs / touch dots
 *   • Middle: dark glass window (peer into the oven cavity)
 *   • Bottom: a horizontal handle bar near the top of the door
 * Different from a regular door — no upper handles, no shaker frame.
 */
function OvenFront({
  bodyW,
  bodyHeight,
  bodyY,
  facadeColor,
  onPress,
}: {
  bodyW: number;
  bodyHeight: number;
  bodyY: number;
  facadeColor: number;
  onPress: () => void;
}) {
  const stripH = 0.075;
  const stripY = bodyY + bodyHeight / 2 - stripH / 2;       // control strip at top
  const doorH  = bodyHeight - stripH - 0.01;
  const doorY  = stripY - stripH / 2 - doorH / 2 - 0.005;   // oven door below strip
  const windowW = bodyW * 0.78;
  const windowH = doorH * 0.62;
  const handleW = bodyW * 0.7;
  const press = stopAnd(onPress);

  return (
    <group>
      {/* Control strip (slightly darker than the cabinet body) */}
      <mesh position={[0, stripY, FRONT + 0.002]} onClick={press}>
        <boxGeometry args={[bodyW - 0.01, stripH, 0.006]} />
        <meshStandardMaterial color={0x1a1a18} roughness={0.5} metalness={0.4} />
      </mesh>

      {/* 4 control knobs / LEDs on the strip */}
      {[-0.36, -0.12, 0.12, 0.36].map((rx, i) => (
        <mesh
          key={i}
          position={[bodyW * rx, stripY, FRONT + 0.012]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.014, 0.014, 0.01, 14]} />
          <meshStandardMaterial color={0x9a9a96} roughness={0.35} metalness={0.7} />
        </mesh>
      ))}
      {/* Small red status LED */}
      <mesh position={[bodyW * 0.46, stripY, FRONT + 0.013]}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color={0xff4a3a} />
      </mesh>

      {/* Oven door panel (same color as cabinet facade, with a dark glass window) */}
      <mesh position={[0, doorY, FRONT + 0.001]} onClick={press}>
        <boxGeometry args={[bodyW - 0.01, doorH, 0.006]} />
        <meshStandardMaterial color={facadeColor} roughness={0.6} />
      </mesh>

      {/* Dark glass window inset */}
      <mesh position={[0, doorY, FRONT + 0.005]} onClick={press}>
        <boxGeometry args={[windowW, windowH, 0.002]} />
        <meshStandardMaterial color={0x141416} roughness={0.2} metalness={0.5} />
      </mesh>

      {/* Glass frame (chrome outline) */}
      {[
        { y: doorY + windowH / 2 - 0.0025, w: windowW + 0.012, h: 0.005 },
        { y: doorY - windowH / 2 + 0.0025, w: windowW + 0.012, h: 0.005 },
      ].map((seg, k) => (
        <mesh key={'fh-' + k} position={[0, seg.y, FRONT + 0.006]}>
          <boxGeometry args={[seg.w, seg.h, 0.002]} />
          <meshStandardMaterial color={0xbfc4c8} roughness={0.25} metalness={0.85} />
        </mesh>
      ))}
      {[
        { x: -windowW / 2 - 0.005, w: 0.005 },
        { x: +windowW / 2 + 0.005, w: 0.005 },
      ].map((seg, k) => (
        <mesh key={'fv-' + k} position={[seg.x, doorY, FRONT + 0.006]}>
          <boxGeometry args={[seg.w, windowH + 0.012, 0.002]} />
          <meshStandardMaterial color={0xbfc4c8} roughness={0.25} metalness={0.85} />
        </mesh>
      ))}

      {/* Horizontal chrome handle bar near top of door */}
      <mesh
        position={[0, doorY + doorH / 2 - 0.06, FRONT + 0.012]}
        onClick={press}
      >
        <boxGeometry args={[handleW, 0.014, 0.022]} />
        <meshStandardMaterial color={0xbfc4c8} roughness={0.22} metalness={0.88} />
      </mesh>
      {/* Two small stand-offs holding the handle */}
      {[-handleW / 2 + 0.02, +handleW / 2 - 0.02].map((hx, k) => (
        <mesh key={'so-' + k} position={[hx, doorY + doorH / 2 - 0.06, FRONT + 0.006]}>
          <cylinderGeometry args={[0.006, 0.006, 0.014, 10]} />
          <meshStandardMaterial color={0xbfc4c8} roughness={0.25} metalness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * SinkFront — sink cabinet facade.
 *
 * A real sink cabinet can't have a top drawer because the sink basin
 * + plumbing fills that space. Standard solution in shop kitchens is a
 * "false front" panel at the top (looks like a drawer, doesn't open),
 * then 2 doors below. We render that.
 */
function SinkFront({
  bodyW,
  bodyHeight,
  bodyY,
  facadeColor,
  lineCol,
  accent,
  handle,
  onSelect,
}: {
  bodyW: number;
  bodyHeight: number;
  bodyY: number;
  facadeColor: number;
  lineCol: number;
  accent: number;
  handle: HandleType;
  onSelect: () => void;
}) {
  const fakeH = 0.13;                                     // false-drawer panel height
  const fakeY = bodyY + bodyHeight / 2 - fakeH / 2 - 0.003;
  const doorH = bodyHeight - fakeH - 0.015;
  const doorY = fakeY - fakeH / 2 - doorH / 2 - 0.005;
  const doorW = bodyW / 2 - 0.003;
  const press = stopAnd(onSelect);
  const cyclePress = press;   // tapping any sub-panel just selects

  return (
    <group>
      {/* False-front panel (looks like a drawer, doesn't open) */}
      <mesh position={[0, fakeY, FRONT + 0.001]} onClick={cyclePress}>
        <boxGeometry args={[bodyW - 0.005, fakeH, 0.005]} />
        <meshStandardMaterial color={facadeColor} roughness={0.6} />
      </mesh>
      {/* Separator line between false-front and doors */}
      <mesh position={[0, fakeY - fakeH / 2 - 0.002, FRONT + 0.002]}>
        <boxGeometry args={[bodyW - 0.01, 0.002, 0.002]} />
        <meshStandardMaterial color={lineCol} transparent opacity={0.3} />
      </mesh>

      {/* 2 doors below (left + right) */}
      <mesh position={[-bodyW / 4, doorY, FRONT + 0.001]} onClick={cyclePress}>
        <boxGeometry args={[doorW, doorH, 0.005]} />
        <meshStandardMaterial color={facadeColor} roughness={0.6} />
      </mesh>
      <mesh position={[+bodyW / 4, doorY, FRONT + 0.001]} onClick={cyclePress}>
        <boxGeometry args={[doorW, doorH, 0.005]} />
        <meshStandardMaterial color={facadeColor} roughness={0.6} />
      </mesh>
      {/* Center divider between doors */}
      <mesh position={[0, doorY, FRONT + 0.003]}>
        <boxGeometry args={[0.003, doorH - 0.02, 0.002]} />
        <meshStandardMaterial color={lineCol} transparent opacity={0.3} />
      </mesh>

      {/* Two handles — one per door, near the top of each door */}
      <DoorHandle
        xCenter={-bodyW / 4}
        bodyY={doorY}
        bodyHeight={doorH}
        doorWidth={doorW}
        type={handle}
        onPress={onSelect}
        accent={accent}
      />
      <DoorHandle
        xCenter={+bodyW / 4}
        bodyY={doorY}
        bodyHeight={doorH}
        doorWidth={doorW}
        type={handle}
        onPress={onSelect}
        accent={accent}
      />

      {/* Small fake-drawer indicator (a thin chrome notch in the middle of the false panel) */}
      <mesh position={[0, fakeY, FRONT + 0.005]} onClick={press}>
        <boxGeometry args={[bodyW * 0.18, 0.006, 0.003]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ── Main component ────────────────────────────────────────────

export function Cabinet({
  cabinet,
  position,
  facadeColor,
  doorStyle,
  handle,
  sinkType,
  stoveType,
  isSelected,
  faucetStyle,
  faucetFinish,
  burners,
  onSelect,
  onFocusDetail,
}: Props) {
  const isTall = cabinet.type === 'tall' || cabinet.type === 'fridge';
  const isFridge = cabinet.type === 'fridge';
  const drawerCount =
    cabinet.type === 'drawer3' ? 3 : cabinet.type === 'drawer4' ? 4 : 0;
  const isDrawer = drawerCount > 0;
  const hasSink = cabinet.type === 'sink' || cabinet.type === 'sink_stove';
  const hasStove = cabinet.type === 'stove' || cabinet.type === 'sink_stove';
  const isCombo = cabinet.type === 'sink_stove';
  /* Stove cabinet gets an "oven front"; sink cabinet gets a "false-drawer + 2 doors"
     front. The combo cabinet renders BOTH treatments side-by-side. */
  const isStoveOnly = cabinet.type === 'stove';
  const isSinkOnly  = cabinet.type === 'sink';
  /* The regular door system is disabled for any cabinet that has its own facade */
  const usesCustomFront = isStoveOnly || isSinkOnly || isCombo;
  const isWideDoor = !isDrawer && !isFridge && !usesCustomFront && cabinet.width > DOUBLE_DOOR_W;
  const hasDoor = !isDrawer && !isFridge && !usesCustomFront;

  const bodyHeight = isTall ? TALL_HEIGHT : CABINET_HEIGHT;
  const bodyY = isTall ? bodyHeight / 2 : PLINTH_HEIGHT + bodyHeight / 2;
  const bodyW = cabinet.width - 0.003;
  const worktopTopY = PLINTH_HEIGHT + CABINET_HEIGHT + WORKTOP_THICKNESS;

  /* Phase D X-ray + benchmark indicators */
  const viewMode = useUI((s) => s.viewMode);
  const currentPhase = useUI((s) => s.currentPhase);
  const isXray = viewMode === 'xray';
  const showBenchmark = currentPhase === 'D';

  /* Resolve per-cabinet hinge brand → cup edge offset (mm).
     Falls back to Hettich if no override set. */
  const cabinetHardware = useUI((s) => s.cabinetHardware[cabinet.id]);
  const hingeBrand = cabinetHardware?.hingeBrand ?? 'hettich';
  const cupEdgeOffsetMm =
    hingeBrand === 'blum'    ? 5 :
    hingeBrand === 'boyard'  ? 6 :
    /* hettich */              5;

  /* Contrast accent — dark facade gets light hardware/lines and vice-versa.
     Fridge keeps its dark accent because its body is metallic light. */
  const accent = isFridge ? 0x2c2c2a : accentForFacade(facadeColor);
  const lineCol = isFridge ? 0x000000 : lineForFacade(facadeColor);

  // Tapping any part of the cabinet body / door / handle just SELECTS it.
  // All changes are made from the selection pill — tapping never mutates.
  const onBodyClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  };
  const onHandlePress = () => onSelect();

  // Fixtures select the cabinet AND zoom the camera to that fixture.
  const onSinkPress = () => onFocusDetail('sink');
  const onStovePress = () => onFocusDetail('stove');
  const onFaucetPress = () => onFocusDetail('faucet');

  // Door handles per door
  const doorHandles: React.ReactNode = isDrawer || isFridge
    ? null
    : isWideDoor
    ? (
      <>
        <DoorHandle
          xCenter={-bodyW / 4}
          bodyY={bodyY}
          bodyHeight={bodyHeight}
          doorWidth={bodyW / 2}
          type={handle}
          onPress={onHandlePress}
          accent={accent}
        />
        <DoorHandle
          xCenter={+bodyW / 4}
          bodyY={bodyY}
          bodyHeight={bodyHeight}
          doorWidth={bodyW / 2}
          type={handle}
          onPress={onHandlePress}
          accent={accent}
        />
      </>
    )
    : (
      <DoorHandle
        xCenter={0}
        bodyY={bodyY}
        bodyHeight={bodyHeight}
        doorWidth={bodyW}
        type={handle}
        onPress={onHandlePress}
        accent={accent}
      />
    );

  return (
    <group position={position}>
      {/* Body — main click target (uses face normal to differentiate door vs side).
          In X-ray mode the facade drops to 35% opacity so the carcass and
          drilling marks become visible. */}
      <mesh position={[0, bodyY, 0]} onClick={onBodyClick}>
        <boxGeometry args={[bodyW, bodyHeight, CABINET_DEPTH]} />
        <meshStandardMaterial
          color={isFridge ? 0xd6d9dc : facadeColor}
          roughness={isFridge ? 0.32 : 0.6}
          metalness={isFridge ? 0.5 : 0}
          transparent={isXray}
          opacity={isXray ? 0.35 : 1}
          depthWrite={!isXray}
        />
      </mesh>

      {/* X-ray overlay — drill dots + hinge cups + slide rails.
          cupEdgeOffsetMm changes with hinge brand → column shifts visibly. */}
      {isXray && !isFridge && (
        <XrayOverlay
          bodyW={bodyW}
          bodyHeight={bodyHeight}
          bodyY={bodyY}
          isDrawer={isDrawer}
          drawerCount={drawerCount}
          hasDoor={hasDoor}
          cupEdgeOffsetMm={cupEdgeOffsetMm}
        />
      )}

      {/* Structural benchmark dot — Phase D only, V1 stub (always green) */}
      {showBenchmark && (
        <mesh
          position={[bodyW / 2 - 0.025, bodyY + bodyHeight / 2 - 0.025, FRONT + 0.012]}
        >
          <sphereGeometry args={[0.012, 10, 10]} />
          <meshBasicMaterial color={BENCHMARK_OK} />
        </mesh>
      )}

      {/* Plinth — clicking it also selects */}
      {!isTall && (
        <mesh
          position={[0, PLINTH_HEIGHT / 2, 0.02]}
          onClick={stopAnd(onSelect)}
        >
          <boxGeometry args={[bodyW, PLINTH_HEIGHT, CABINET_DEPTH - 0.05]} />
          <meshStandardMaterial color={0x3a3a37} roughness={0.85} />
        </mesh>
      )}

      {/* Double-door divider */}
      {isWideDoor && (
        <mesh position={[0, bodyY, FRONT]}>
          <boxGeometry args={[0.003, bodyHeight - 0.05, 0.002]} />
          <meshStandardMaterial color={lineCol} transparent opacity={0.22} />
        </mesh>
      )}

      {/* Realistic 3D drawer fronts (replaces the old divider lines) */}
      {isDrawer && !isXray && (
        <DrawerStack
          count={drawerCount}
          bodyW={bodyW}
          facadeColor={facadeColor}
          lineCol={lineCol}
          accent={accent}
          handle={handle}
          onSelect={onSelect}
        />
      )}

      {/* Fridge seam */}
      {isFridge && (
        <mesh position={[0, bodyHeight * 0.66, FRONT]}>
          <boxGeometry args={[bodyW - 0.02, 0.005, 0.002]} />
          <meshStandardMaterial color={lineCol} transparent opacity={0.2} />
        </mesh>
      )}

      {/* Door style overlay */}
      {hasDoor && doorStyle === 'shaker' && (
        <ShakerFrame bodyW={bodyW} bodyHeight={bodyHeight} bodyY={bodyY} lineCol={lineCol} />
      )}
      {hasDoor && doorStyle === 'grooved' && (
        <Grooves bodyW={bodyW} bodyHeight={bodyHeight} bodyY={bodyY} lineCol={lineCol} />
      )}

      {/* Handles — doors only (drawer handles live inside DrawerStack) */}
      {doorHandles}
      {isFridge && <FridgeHandle bodyW={bodyW} bodyHeight={bodyHeight} onPress={onHandlePress} />}

      {/* Stand-alone stove cabinet — full oven front */}
      {isStoveOnly && !isXray && (
        <OvenFront
          bodyW={bodyW}
          bodyHeight={bodyHeight}
          bodyY={bodyY}
          facadeColor={facadeColor}
          onPress={onSelect}
        />
      )}

      {/* Stand-alone sink cabinet — false-drawer top + 2 doors below */}
      {isSinkOnly && !isXray && (
        <SinkFront
          bodyW={bodyW}
          bodyHeight={bodyHeight}
          bodyY={bodyY}
          facadeColor={facadeColor}
          lineCol={lineCol}
          accent={accent}
          handle={handle}
          onSelect={onSelect}
        />
      )}

      {/* Combo (sink + stove) — render BOTH halves side-by-side.
          Translated via inner groups so each half lives in its own cab-local x. */}
      {isCombo && !isXray && (
        <>
          <group position={[-bodyW / 4, 0, 0]}>
            <SinkFront
              bodyW={bodyW / 2}
              bodyHeight={bodyHeight}
              bodyY={bodyY}
              facadeColor={facadeColor}
              lineCol={lineCol}
              accent={accent}
              handle={handle}
              onSelect={onSelect}
            />
          </group>
          <group position={[+bodyW / 4, 0, 0]}>
            <OvenFront
              bodyW={bodyW / 2}
              bodyHeight={bodyHeight}
              bodyY={bodyY}
              facadeColor={facadeColor}
              onPress={onSelect}
            />
          </group>
          {/* Divider between halves */}
          <mesh position={[0, bodyY, FRONT + 0.004]}>
            <boxGeometry args={[0.004, bodyHeight - 0.02, 0.002]} />
            <meshStandardMaterial color={lineCol} transparent opacity={0.3} />
          </mesh>
        </>
      )}

      {/* Sink + stove */}
      {!isTall && hasSink && (
        <Sink
          xOffset={isCombo ? -bodyW / 4 : 0}
          width={isCombo ? bodyW / 2 : bodyW}
          worktopTopY={worktopTopY}
          sinkType={sinkType}
          faucetStyle={faucetStyle}
          faucetFinish={faucetFinish}
          onPress={onSinkPress}
          onFaucetPress={onFaucetPress}
        />
      )}
      {!isTall && hasStove && (
        <Stove
          xOffset={isCombo ? +bodyW / 4 : 0}
          width={isCombo ? bodyW / 2 : bodyW}
          worktopTopY={worktopTopY}
          stoveType={stoveType}
          burners={burners}
          onPress={onStovePress}
        />
      )}

      {/* Selection highlight — blue 16% opacity box around the body */}
      {isSelected && (
        <mesh position={[0, bodyY, 0]}>
          <boxGeometry args={[bodyW + 0.04, bodyHeight + 0.05, CABINET_DEPTH + 0.05]} />
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
