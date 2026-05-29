/**
 * Root layout — providers, gesture root, status bar.
 *
 * Web: wraps the app in a centered mobile-frame container so the layout
 * matches the iOS / Android UX 1:1. Real mobile devices skip the frame
 * (the OS already gives us the right viewport).
 */
import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/tokens';

/* iPhone 14 Pro is 393×852; iPhone 13/14 is 390×844. We target 390×844
   as the canonical "mobile" frame size on desktop browsers. */
const FRAME_W = 390;
const FRAME_H = 844;
/* Above this viewport width we draw the desktop frame; below it we go
   full-bleed (real mobile or narrow browser window). */
const DESKTOP_BREAKPOINT = 520;

export default function RootLayout() {
  const { width: vw, height: vh } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && vw >= DESKTOP_BREAKPOINT;

  /* On native — return the original layout (no frame, no extra container). */
  if (!isWeb) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor={COLORS.bg} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.bg },
              animation: 'fade',
            }}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  /* Web on a narrow viewport (<520px) — full-bleed, no frame. */
  if (!isDesktop) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor={COLORS.bg} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.bg },
              animation: 'fade',
            }}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  /* Web on a desktop viewport — render a phone-shaped frame in the centre. */
  const frameHeight = Math.min(FRAME_H, vh - 48);
  return (
    <View style={styles.deskBg}>
      <View
        style={[
          styles.frame,
          { width: FRAME_W, height: frameHeight },
        ]}
      >
        {/* Top notch (cosmetic — looks like a phone) */}
        <View style={styles.notch} />
        <GestureHandlerRootView style={styles.frameInner}>
          <SafeAreaProvider>
            <StatusBar style="dark" backgroundColor={COLORS.bg} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.bg },
                animation: 'fade',
              }}
            />
          </SafeAreaProvider>
        </GestureHandlerRootView>
        {/* Bottom home indicator */}
        <View style={styles.homeIndicator} />
      </View>
      <DesktopHint />
    </View>
  );
}

/** Small text under the frame so visitors know it's a mobile demo. */
function DesktopHint() {
  return (
    <View style={styles.hintRow}>
      <View style={styles.hintDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  /* The space around the phone frame on a desktop browser */
  deskBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1f1d',
    padding: 24,
  },
  /* The phone-shaped card */
  frame: {
    borderRadius: 44,
    backgroundColor: '#000',
    padding: 8,
    /* iOS-style shadow on web (translates to box-shadow via RN Web) */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  /* Inner content — inset slightly from the frame edge */
  frameInner: {
    flex: 1,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
  },
  /* Black notch at the top — purely cosmetic */
  notch: {
    position: 'absolute',
    top: 10,
    left: '50%',
    width: 120,
    height: 22,
    marginLeft: -60,
    borderRadius: 12,
    backgroundColor: '#000',
    zIndex: 10,
  },
  /* Bottom home indicator bar */
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    width: 120,
    height: 4,
    marginLeft: -60,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    zIndex: 10,
  },
  /* Subtle indicator below the phone (decorative) */
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    opacity: 0.4,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
});
