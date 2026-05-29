/**
 * Haptic feedback helpers.
 *
 * Per HANDOVER §9 acceptance:
 *   selectionAsync — taps (selection, cycle)
 *   impactAsync('light') — swatch picks, material card
 *
 * Safe-wrapped in try/catch because expo-haptics throws on simulator / unsupported
 * devices; we never want UI to break from a missing vibration.
 */
import * as Haptics from 'expo-haptics';

export function hapticTap() {
  Haptics.selectionAsync().catch(() => {});
}

export function hapticSwatch() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticConfirm() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
}
