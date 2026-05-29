import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useT } from '@/lib/i18n';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';

interface Props {
  onPress: () => void;
}

export function NewKitchenButton({ onPress }: Props) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 }]}
    >
      <View style={styles.plus}>
        <Text style={styles.plusTxt}>+</Text>
      </View>
      <Text style={styles.label}>{t('home_new_kitchen')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.lg,
    paddingVertical: SPACE.lg + 2,
    paddingHorizontal: SPACE.xl,
    ...SHADOWS.lg,
  },
  plus: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  plusTxt: { color: '#fff', fontSize: 18, lineHeight: 22, fontWeight: '300' },
  label: { ...TYPE.bodyMed, color: '#fff', fontSize: 16 },
});
