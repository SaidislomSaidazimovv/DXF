/**
 * CameraRig — NFS camera (HANDOVER §3.4, 10_UI §5).
 *
 * Drives camera position + lookAt via per-frame lerp.
 *   - 480ms easeOutCubic when selection changes
 *   - 540ms easeOutCubic when view mode flips (3D ↔ 2D)
 *   - Single animated value, no competing tweens
 */
import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@/lib/three/r3f';
import * as THREE from 'three';
import {
  OVERVIEW_TARGET,
  PLAN_TARGET,
  XRAY_TARGET,
  GEOMETRY,
  computeCabinetCameraTarget,
} from '@/types/ui';
import type { CameraTarget } from '@/types/ui';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { findPlaced } from '@/lib/three/cabinetLayout';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const FOV = 38;

/**
 * Frame a focused element large and near-centred — the bottom modal is gone
 * (controls now live in a right-edge rail + flyout), so the element no longer
 * has to be shoved into a narrow top band. Instead:
 *   • lookBelow = dist·0.12 keeps the element a touch above centre, clear of
 *     the bottom CTA bar;
 *   • biasX shifts the aim slightly RIGHT so the element renders in the LEFT
 *     portion of the screen, away from the right-side flyout. Portrait hfov is
 *     narrow, so the factor is small (0.05) to avoid clipping the left edge.
 *   • distances are much closer than before so the master sees the detail.
 */
function frameTarget(
  cx: number,
  centerY: number,
  cz: number,
  dist: number,
  lookZ?: number,
  biasX = 0.05,
): CameraTarget {
  const side = cx >= 0 ? 0.28 : -0.28;
  const lookBelow = dist * 0.12;     // element a touch above centre
  const lookRight = dist * biasX;    // → element sits left, clear of flyout
  return {
    position: [cx * 0.5 + side, centerY + dist * 0.26, cz + dist],
    lookAt: [cx + lookRight, centerY - lookBelow, lookZ ?? cz],
    fov: FOV,
    duration: 480,
  };
}

export function CameraRig() {
  const { camera } = useThree();
  const selectedId = useUI((s) => s.selectedCabinetId);
  const selectedUpperId = useUI((s) => s.selectedUpperId);
  const selectedDetail = useUI((s) => s.selectedDetail);
  const selectedWorktop = useUI((s) => s.selectedWorktop);
  const variant = useUI(selectCurrentVariant);
  const viewMode = useUI((s) => s.viewMode);
  const wallMm = useUI((s) => s.wallLengthMm);
  const heroMode = useUI((s) => s.heroMode);

  const fromPos = useRef(new THREE.Vector3());
  const toPos = useRef(new THREE.Vector3());
  const fromLook = useRef(new THREE.Vector3());
  const toLook = useRef(new THREE.Vector3());
  const currentLook = useRef(new THREE.Vector3(...OVERVIEW_TARGET.lookAt));
  const startTime = useRef(0);
  const duration = useRef(480);
  const tweening = useRef(false);
  const targetFov = useRef(OVERVIEW_TARGET.fov);
  const fromFov = useRef(OVERVIEW_TARGET.fov);

  /* Re-target whenever selection / view / variant / wall changes */
  useEffect(() => {
    /* Hero mode = Lock screen turntable. CameraRig's useFrame below drives
       the orbit directly; skip the tween-target machinery. */
    if (heroMode) {
      camera.up.set(0, 1, 0);
      tweening.current = false;
      return;
    }
    let target: CameraTarget;
    if (viewMode === '2d') {
      /* Dynamic plan height — fit current wall width horizontally with margin.
         Without this a wide kitchen would clip on portrait screens. */
      const aspect =
        (camera as THREE.PerspectiveCamera).aspect ?? 0.5;
      const wallM = wallMm / 1000;
      const wantHoriz = wallM + 0.6;
      const fovV = (PLAN_TARGET.fov * Math.PI) / 180;
      const minHeight = wantHoriz / (2 * Math.tan(fovV / 2) * Math.max(0.3, aspect));
      const height = Math.max(4, minHeight);
      target = {
        ...PLAN_TARGET,
        position: [0.01, height, -0.34],
      };
      /* Top-down: world -Z = screen up (back wall at top of plan).
         Without this the camera's up axis becomes degenerate and the kitchen
         appears rotated 90° / squished to one side. */
      camera.up.set(0, 0, -1);
    } else if (viewMode === 'xray') {
      /* Phase D engineering angle — slightly elevated, like looking down
         into the carcass. No selection-specific zoom; the master keeps a
         workshop-overview perspective. */
      camera.up.set(0, 1, 0);
      target = XRAY_TARGET;
    } else if (selectedWorktop) {
      /* Whole worktop run — frame the counter surface, centred on the wall. */
      camera.up.set(0, 1, 0);
      const worktopY =
        GEOMETRY.PLINTH_HEIGHT + GEOMETRY.CABINET_HEIGHT + GEOMETRY.WORKTOP_THICKNESS;
      const cz = variant ? (findPlaced(variant, variant.cabinets[0]?.id)?.groupPosition[2] ?? 0) : 0;
      /* Whole-run worktop is wide — keep it centred (no left bias) and farther. */
      target = frameTarget(0, worktopY, cz, 4.0, undefined, 0);
    } else if (selectedUpperId) {
      /* Wall (upper) cabinet — true centre = upper mid-height. */
      camera.up.set(0, 1, 0);
      const placed = findPlaced(variant, selectedUpperId);
      const upperY = GEOMETRY.UPPER_Y_OFFSET + GEOMETRY.UPPER_HEIGHT / 2;
      target = placed
        ? frameTarget(
            placed.groupPosition[0],
            upperY,
            placed.groupPosition[2] - GEOMETRY.CABINET_DEPTH / 2,
            2.5 + placed.cab.width * 0.4,
          )
        : OVERVIEW_TARGET;
    } else if (selectedDetail && selectedId) {
      /* A fixture (faucet / stove / sink) on the worktop — small element, so
         a closer distance still fits it fully in the top band. */
      camera.up.set(0, 1, 0);
      const placed = findPlaced(variant, selectedId);
      if (placed) {
        const worktopY =
          GEOMETRY.PLINTH_HEIGHT + GEOMETRY.CABINET_HEIGHT + GEOMETRY.WORKTOP_THICKNESS;
        const detailY = selectedDetail === 'faucet' ? worktopY + 0.14 : worktopY + 0.04;
        const detailZ =
          placed.groupPosition[2] - (selectedDetail === 'faucet' ? GEOMETRY.CABINET_DEPTH * 0.18 : 0);
        target = frameTarget(placed.groupPosition[0], detailY, detailZ, 2.3, detailZ);
      } else {
        target = OVERVIEW_TARGET;
      }
    } else if (selectedId) {
      /* Whole base cabinet — true centre between worktop top and plinth. */
      camera.up.set(0, 1, 0);
      const placed = findPlaced(variant, selectedId);
      /* Mid-point from floor to worktop top — the visible base cabinet centre. */
      const baseCenterY =
        (GEOMETRY.PLINTH_HEIGHT + GEOMETRY.CABINET_HEIGHT + GEOMETRY.WORKTOP_THICKNESS) / 2;
      target = placed
        ? frameTarget(
            placed.groupPosition[0],
            baseCenterY,
            placed.groupPosition[2],
            3.2 + placed.cab.width * 0.45,
          )
        : OVERVIEW_TARGET;
    } else {
      camera.up.set(0, 1, 0);
      target = OVERVIEW_TARGET;
    }

    fromPos.current.copy(camera.position);
    toPos.current.set(...target.position);
    fromLook.current.copy(currentLook.current);
    toLook.current.set(...target.lookAt);
    fromFov.current = (camera as THREE.PerspectiveCamera).fov ?? target.fov;
    targetFov.current = target.fov;
    startTime.current = performance.now();
    duration.current = target.duration;
    tweening.current = true;
  }, [selectedId, selectedUpperId, selectedDetail, selectedWorktop, viewMode, variant, wallMm, heroMode, camera]);

  /* Per-frame lerp + hero turntable */
  useFrame(() => {
    if (heroMode) {
      /* Slow turntable orbit around the kitchen — shows all sides over ~40s. */
      const angle = (performance.now() / 1000) * 0.16; // ~9°/s
      const radius = 3.2;
      const cy = 1.55;
      camera.position.set(
        Math.sin(angle) * radius,
        cy,
        Math.cos(angle) * radius - 0.2
      );
      currentLook.current.set(0, 0.55, -0.2);
      camera.lookAt(currentLook.current);
      if (camera instanceof THREE.PerspectiveCamera) {
        if (camera.fov !== OVERVIEW_TARGET.fov) {
          camera.fov = OVERVIEW_TARGET.fov;
          camera.updateProjectionMatrix();
        }
      }
      return;
    }

    if (!tweening.current) return;
    const t = Math.min(
      1,
      (performance.now() - startTime.current) / duration.current
    );
    const e = easeOutCubic(t);
    camera.position.lerpVectors(fromPos.current, toPos.current, e);
    currentLook.current.lerpVectors(fromLook.current, toLook.current, e);
    camera.lookAt(currentLook.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fromFov.current + (targetFov.current - fromFov.current) * e;
      camera.updateProjectionMatrix();
    }
    if (t >= 1) tweening.current = false;
  });

  return null;
}
