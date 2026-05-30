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
  const cabinetFaucetFinish = useUI((s) => s.cabinetFaucetFinish);
  const cabinetBurners = useUI((s) => s.cabinetBurners);
  const upperMaterial = useUI((s) => s.upperMaterial);
  const upperHandle = useUI((s) => s.upperHandle);
  const upperType = useUI((s) => s.upperType);
  const worktopOverride = useUI((s) => s.worktopOverride);
  const selectedId = useUI((s) => s.selectedCabinetId);
  const selectedUpperId = useUI((s) => s.selectedUpperId);
  const viewMode = useUI((s) => s.viewMode);

  /* Actions — store references are stable; no re-renders on action access */
  const selectCabinet = useUI((s) => s.selectCabinet);
  const selectUpper = useUI((s) => s.selectUpper);
  const focusDetail = useUI((s) => s.focusDetail);
  const cycleWorktop = useUI((s) => s.cycleWorktop);

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
            faucetFinish={cabinetFaucetFinish[p.cab.id] ?? 'chrome'}
            burners={cabinetBurners[p.cab.id] ?? 4}
            isSelected={selectedId === p.cab.id}
            onSelect={() => { hapticTap(); selectCabinet(p.cab.id); }}
            onFocusDetail={(d) => { hapticTap(); focusDetail(p.cab.id, d); }}
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
            /* Upper is FULLY independent of the base cabinet below it: it uses
               its OWN override, else the global default — never the base
               cabinet's per-cabinet material/handle. So changing a base colour
               never touches the upper. */
            const upMat = upperMaterial[p.cab.id];
            const facade = upMat ? materialById(upMat).facade : mat.facade;
            return (
              <Upper
                key={'up-' + p.cab.id}
                position={p.groupPosition}
                width={p.cab.width}
                facadeColor={facade}
                handle={upperHandle[p.cab.id] ?? 'bar'}
                kind={upperType[p.cab.id] ?? 'closed'}
                hasHandle={true}
                isSelected={selectedUpperId === p.cab.id}
                onSelect={() => { hapticTap(); selectUpper(p.cab.id); }}
              />
            );
          })}
    </group>
  );
}
