/**
 * Plan grid overlay — HANDOVER §3.5.
 *
 * SVG grid drawn ABOVE the canvas (not as 3D geometry). Fades in/out
 * with viewMode change (540ms easeOutCubic). Pointer-events: none so
 * canvas clicks still pass through.
 *
 * Grid spacing is in screen px (not calibrated to real mm — that
 * calibration depends on dynamic camera height; we may add it in V1).
 *   Minor lines every 24px, opacity 0.05
 *   Major lines every 240px, opacity 0.10
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { useUI } from '@/store/uiStore';

const MINOR = 24;
const MAJOR = 240;

export function PlanGridOverlay() {
  const viewMode = useUI((s) => s.viewMode);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: viewMode === '2d' ? 1 : 0,
      duration: 540,
      useNativeDriver: true,
    }).start();
  }, [viewMode, opacity]);

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="grid-minor"
            width={MINOR}
            height={MINOR}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d={`M ${MINOR} 0 L 0 0 L 0 ${MINOR}`}
              fill="none"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth={0.5}
            />
          </Pattern>
          <Pattern
            id="grid-major"
            width={MAJOR}
            height={MAJOR}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d={`M ${MAJOR} 0 L 0 0 L 0 ${MAJOR}`}
              fill="none"
              stroke="rgba(0,0,0,0.10)"
              strokeWidth={1}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid-minor)" />
        <Rect width="100%" height="100%" fill="url(#grid-major)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
