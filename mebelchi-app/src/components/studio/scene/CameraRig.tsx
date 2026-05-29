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
  computeCabinetCameraTarget,
} from '@/types/ui';
import type { CameraTarget } from '@/types/ui';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { findPlaced } from '@/lib/three/cabinetLayout';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CameraRig() {
  const { camera } = useThree();
  const selectedId = useUI((s) => s.selectedCabinetId);
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
    } else {
      camera.up.set(0, 1, 0);
      if (!selectedId) {
        target = OVERVIEW_TARGET;
      } else {
        const placed = findPlaced(variant, selectedId);
        target = placed
          ? computeCabinetCameraTarget(
              [placed.groupPosition[0], placed.bodyCenterY, placed.groupPosition[2]],
              placed.cab.width
            )
          : OVERVIEW_TARGET;
      }
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
  }, [selectedId, viewMode, variant, wallMm, heroMode, camera]);

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
