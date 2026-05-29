/**
 * R3F platform shim — default entry for TypeScript.
 *
 * Metro picks the platform-specific file at bundle time (.native.ts / .web.ts).
 * This file exists so `tsc` (which doesn't understand Metro's platform
 * resolution) can resolve `@/lib/three/r3f` for type-checking. The runtime
 * never imports this file directly.
 */
export { Canvas, useFrame, useThree } from '@react-three/fiber';
export type { ThreeEvent } from '@react-three/fiber';
