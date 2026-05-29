import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS, RADII, SPACE, TYPE } from '@/lib/tokens';
import { useT } from '@/lib/i18n';

interface Props {
  visible: boolean;
  text?: string;
}

export function AdjacencyWarning({
  visible,
  text,
}: Props) {
  const t = useT();
  const display = text ?? t('adjacency_warn');
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pill,
        { opacity, transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }] },
      ]}
    >
      <Text style={styles.txt}>{display}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.warnBg,
  },
  txt: { ...TYPE.body, color: COLORS.warn, fontSize: 11 },
});
