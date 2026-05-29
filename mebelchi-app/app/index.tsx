/**
 * Splash — black background, MEBELCHI logo center, fade-in then routes.
 * HANDOVER §4.1: 800ms total, then go to /home (or /setup if first run).
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useUI } from '@/store/uiStore';
import { COLORS, TYPE, SPACE } from '@/lib/tokens';

export default function Splash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const hasCompletedSetup = useUI((s) => s.hasCompletedSetup);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.delay(280),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      router.replace(hasCompletedSetup ? '/home' : '/setup');
    });
  }, [opacity, hasCompletedSetup]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.logoBox, { opacity }]}>
        <Text style={styles.logo}>MEBELCHI</Text>
        <Text style={styles.tag}>КУХНИ · СТУДИЯ</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f0f10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: { alignItems: 'center', gap: SPACE.sm },
  logo: { ...TYPE.brandLogo, color: '#ffffff', fontSize: 22, letterSpacing: 2 },
  tag:  { ...TYPE.brandTag,  color: 'rgba(255,255,255,0.5)' },
});
