/**
 * Kitchen — composes cabinets, uppers, segmented worktops.
 * Day 4: wires click handlers + selection state.
 */
import React, { useMemo } from 'react';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { materialById } from '@/mocks/materials';
import { Cabinet } from './Cabinet';
import { Worktop } from './Worktop';
import { Upper } from './Upper';
import { ConstraintMarkers3D } from './ConstraintMarkers3D';
import { layoutVariant, isTallType } from '@/lib/three/cabinetLayout';
import { hapticTap } from '@/lib/haptics';

export function Kitchen() {
  const variant = useUI(selectCurrentVariant);
  const globalMat = useUI((s) => s.globalMaterial);
  const globalDoorStyle = useUI((s) => s.globalDoorStyle);
  const cabinetMaterial = useUI((s) => s.cabinetMaterial);
  const cabinetDoorStyle = useUI((s) => s.cabinetDoorStyle);
  const cabinetHandle = useUI((s) => s.cabinetHandle);
  const sinkType = useUI((s) => s.sinkType);
  const stoveType = useUI((s) => s.stoveType);
  const cabinetSink = useUI((s) => s.cabinetSink);
  const cabinetStove = useUI((s) => s.cabinetStove);
  const cabinetFaucet = useUI((s) => s.cabinetFaucet);
  const upperMaterial = useUI((s) => s.upperMaterial);
  const upperHandle = useUI((s) => s.upperHandle);
  const worktopOverride = useUI((s) => s.worktopOverride);
  const selectedId = useUI((s) => s.selectedCabinetId);
  const selectedUpperId = useUI((s) => s.selectedUpperId);
  const viewMode = useUI((s) => s.viewMode);

  /* Actions — store references are stable; no re-renders on action access */
  const selectCabinet = useUI((s) => s.selectCabinet);
  const selectUpper = useUI((s) => s.selectUpper);
  const cycleDoorStyle = useUI((s) => s.cycleDoorStyle);
  const cycleHandle = useUI((s) => s.cycleHandle);
  const cycleUpperHandle = useUI((s) => s.cycleUpperHandle);
  const cycleSink = useUI((s) => s.cycleSink);
  const cycleStove = useUI((s) => s.cycleStove);
  const cycleFaucet = useUI((s) => s.cycleFaucet);
  const cycleWorktop = useUI((s) => s.cycleWorktop);
  const cycleDrawer = useUI((s) => s.cycleCabinetDrawerCount);

  const mat = materialById(globalMat);

  const layout = useMemo(() => {
    if (!variant || variant.cabinets.length === 0) return null;
    const placed = layoutVariant(variant);

    /* Worktop segments — consecutive non-tall runs */
    const segments: { startX: number; endX: number }[] = [];
    let segStart: number | null = null;
    for (const p of placed) {
      if (!p.isTall && segStart === null) segStart = p.xStart;
      if (p.isTall && segStart !== null) {
        segments.push({ startX: segStart, endX: p.xStart });
        segStart = null;
      }
    }
    if (segStart !== null) {
      const last = placed[placed.length - 1];
      segments.push({ startX: segStart, endX: last.xEnd });
    }

    return { placed, segments };
  }, [variant]);

  if (!layout || !variant) return null;

  return (
    <group>
      {/* Phase A constraints — rendered as wall + floor hints. Sit BEHIND
          cabinets so they don't intercept clicks. */}
      <ConstraintMarkers3D />

      {/* Cabinets */}
      {layout.placed.map((p) => {
        const perCabMat = cabinetMaterial[p.cab.id];
        const facade = perCabMat ? materialById(perCabMat).facade : mat.facade;
        return (
          <Cabinet
            key={p.cab.id}
            cabinet={p.cab}
            position={p.groupPosition}
            facadeColor={facade}
            doorStyle={cabinetDoorStyle[p.cab.id] ?? globalDoorStyle}
            handle={cabinetHandle[p.cab.id] ?? 'bar'}
            sinkType={cabinetSink[p.cab.id] ?? sinkType}
            stoveType={cabinetStove[p.cab.id] ?? stoveType}
            faucetStyle={cabinetFaucet[p.cab.id] ?? 'arch'}
            isSelected={selectedId === p.cab.id}
            onSelect={() => { hapticTap(); selectCabinet(p.cab.id); }}
            onCycleDoor={() => { hapticTap(); cycleDoorStyle(p.cab.id); }}
            onCycleHandle={() => { hapticTap(); cycleHandle(p.cab.id); }}
            onCycleSink={() => { hapticTap(); cycleSink(p.cab.id); }}
            onCycleStove={() => { hapticTap(); cycleStove(p.cab.id); }}
            onCycleFaucet={() => { hapticTap(); cycleFaucet(p.cab.id); }}
            onCycleDrawer={() => { hapticTap(); cycleDrawer(p.cab.id); }}
          />
        );
      })}

      {/* Worktops — one per non-tall segment */}
      {layout.segments.map((seg, i) => {
        const w = seg.endX - seg.startX;
        const cx = (seg.startX + seg.endX) / 2;
        return (
          <Worktop
            key={'wt-' + i}
            totalWidth={w}
            centerX={cx}
            centerZ={layout.placed[0].groupPosition[2]}
            color={mat.top}
            override={worktopOverride}
            onPress={() => { hapticTap(); cycleWorktop(); }}
          />
        );
      })}

      {/* Uppers — non-tall only, if variant has them. Hidden in 2D so the
          plan view shows the base cabinet footprint clearly. */}
      {variant.hasUppers && viewMode !== '2d' &&
        layout.placed
          .filter((p) => !isTallType(p.cab.type))
          .map((p) => {
            /* Upper has its OWN material/handle override (falls back to the
               base cabinet's, then global) so it can be customised separately. */
            const upMat = upperMaterial[p.cab.id] ?? cabinetMaterial[p.cab.id];
            const facade = upMat ? materialById(upMat).facade : mat.facade;
            return (
              <Upper
                key={'up-' + p.cab.id}
                position={p.groupPosition}
                width={p.cab.width}
                facadeColor={facade}
                handle={upperHandle[p.cab.id] ?? cabinetHandle[p.cab.id] ?? 'bar'}
                hasHandle={true}
                isSelected={selectedUpperId === p.cab.id}
                onSelect={() => { hapticTap(); selectUpper(p.cab.id); }}
                onCycleHandle={() => { hapticTap(); cycleUpperHandle(p.cab.id); }}
              />
            );
          })}
    </group>
  );
}
