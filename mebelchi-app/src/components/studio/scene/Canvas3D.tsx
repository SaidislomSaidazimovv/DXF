/**
 * Canvas3D — R3F Canvas wrapper.
 * Floor click → deselect (gesture #7).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@/lib/three/r3f';
import { Lights } from './Lights';
import { Floor } from './Floor';
import { BackWall } from './BackWall';
import { Kitchen } from './Kitchen';
import { CameraRig } from './CameraRig';
import { GLRegistrar } from './GLRegistrar';
import { PlanGridOverlay } from '../PlanGridOverlay';
import { OVERVIEW_TARGET } from '@/types/ui';
import { useUI } from '@/store/uiStore';
import { hapticTap } from '@/lib/haptics';

export function Canvas3D() {
  const selectCabinet = useUI((s) => s.selectCabinet);
  const selectedId = useUI((s) => s.selectedCabinetId);

  return (
    <View style={styles.root}>
      <Canvas
        gl={{ antialias: true }}
        camera={{
          position: OVERVIEW_TARGET.position,
          fov: OVERVIEW_TARGET.fov,
          near: 0.05,
          far: 100,
        }}
      >
        <Lights />
        <Floor onPress={() => { if (selectedId) hapticTap(); selectCabinet(null); }} />
        <BackWall />
        <Kitchen />
        <CameraRig />
        <GLRegistrar />
      </Canvas>
      {/* Plan-view grid: fades in when 2D mode is active */}
      <PlanGridOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ede8db' },
});
