/**
 * Scene screenshot capture — used by Phase B's customer-confirmation flow
 * to save a real PNG of the 3D scene with timestamp.
 *
 * Strategy:
 *   • The Canvas3D component registers its WebGL context here via
 *     `registerGLContext(gl)` (called once on mount).
 *   • Phase B's confirmation flow calls `captureSceneScreenshot()` which
 *     uses expo-gl's `GLView.takeSnapshotAsync(gl)` to read pixels into
 *     a PNG, then saves the file to the app's document directory under
 *     `confirmations/<timestamp>.png`.
 *
 * On the web build (`r3f.web.ts`), there is no expo-gl — we fall back to
 * a data URL from the canvas. Both paths return a usable string URI.
 *
 * Caveats:
 *   • If no GL context is registered yet (cold launch, never visited
 *     Phase B), captureSceneScreenshot returns a mock path so the rest
 *     of the flow doesn't crash.
 */
import { Platform } from 'react-native';
/* expo-file-system v19 ships a new Paths/File API at the top level and
   keeps the legacy filesystem helpers under `/legacy`. We use the legacy
   path because takeSnapshotAsync returns a temp URI we need to move. */
import * as FileSystem from 'expo-file-system/legacy';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';

/** Cache of the most recent gl context handed in by Canvas3D. */
let glRef: ExpoWebGLRenderingContext | null = null;

export function registerGLContext(gl: ExpoWebGLRenderingContext): void {
  glRef = gl;
}

export function unregisterGLContext(): void {
  glRef = null;
}

/**
 * Capture the current scene to a PNG. Returns a file URI (file://...) or a
 * mock path if no context is available yet.
 */
export async function captureSceneScreenshot(): Promise<string> {
  const ts = Date.now();
  const dir = (FileSystem.documentDirectory ?? '') + 'confirmations/';
  const path = dir + ts + '.png';

  /* Web: no expo-gl. Try the underlying canvas's toDataURL. */
  if (Platform.OS === 'web') {
    try {
      const canvas = (typeof document !== 'undefined')
        ? (document.querySelector('canvas') as HTMLCanvasElement | null)
        : null;
      if (canvas) return canvas.toDataURL('image/png');
    } catch {/* ignore — fall through to mock */}
    return '/mock/confirmations/' + ts + '.png';
  }

  if (!glRef) {
    /* Never visited Phase B / R3F not mounted yet — return a mock path
       rather than crash. The rest of the flow only needs the string. */
    return path + ':mock';
  }

  try {
    /* Ensure the dir exists */
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

    /* expo-gl reads back pixels and writes a temp PNG */
    const result = await GLView.takeSnapshotAsync(glRef, {
      format: 'png',
      compress: 1,
    });
    const tmpUri = typeof result.uri === 'string'
      ? result.uri
      : (result.uri as unknown as { uri: string })?.uri ?? '';
    if (!tmpUri) return path + ':mock';

    /* Move from cache to confirmations/ so it survives later cleanups */
    await FileSystem.moveAsync({ from: tmpUri, to: path });
    return path;
  } catch (e) {
    /* Don't crash the confirmation flow — emit mock path instead */
    return path + ':capture-failed';
  }
}
