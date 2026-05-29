/**
 * R3F platform shim — web variant.
 * Metro/Webpack picks this up for web builds (regular WebGL, no expo-gl).
 */
export { Canvas, useFrame, useThree } from '@react-three/fiber';
export type { ThreeEvent } from '@react-three/fiber';
