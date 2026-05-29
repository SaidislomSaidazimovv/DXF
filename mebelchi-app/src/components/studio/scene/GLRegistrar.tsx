/**
 * GLRegistrar — runs inside the R3F Canvas so it can grab the GL context
 * via `useThree()` and hand it to `screenshot.ts`. Renders nothing.
 *
 * We register on mount and unregister on unmount so a stale gl ref doesn't
 * outlive the canvas (e.g. if the user navigates between phases).
 */
import { useEffect } from 'react';
import { useThree } from '@/lib/three/r3f';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { registerGLContext, unregisterGLContext } from '@/lib/screenshot';

export function GLRegistrar() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    /* renderer.getContext() returns the underlying GL — on native this is
       an ExpoWebGLRenderingContext; on web it's a WebGL2RenderingContext.
       screenshot.ts handles both. */
    const ctx = (gl as { getContext?: () => unknown }).getContext?.() as
      | ExpoWebGLRenderingContext
      | undefined;
    if (ctx) registerGLContext(ctx);
    return () => unregisterGLContext();
  }, [gl]);
  return null;
}
