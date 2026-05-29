/**
 * Setup wizard — shown once. HANDOVER §4.3.
 * Fields: shop name, supplier, thickness, hardware brand.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUI } from '@/store/uiStore';
import { WizardField } from '@/components/setup/WizardField';
import { WizardChoice } from '@/components/setup/WizardChoice';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';
import type { HardwareBrand, SupplierId, Thickness } from '@/types/ui';

const SUPPLIERS: ReadonlyArray<{ value: SupplierId; label: string }> = [
  { value: 'imkon',         label: 'Imkon Group' },
  { value: 'egger_uz',      label: 'Egger UZ' },
  { value: 'kronospan_uz',  label: 'Kronospan UZ' },
] as const;

const THICKNESSES: ReadonlyArray<{ value: Thickness; label: string }> = [
  { value: 10, label: '10 мм' },
  { value: 16, label: '16 мм' },
  { value: 18, label: '18 мм' },
] as const;

const HARDWARE: ReadonlyArray<{ value: HardwareBrand; label: string }> = [
  { value: 'blum',    label: 'Blum' },
  { value: 'hettich', label: 'Hettich' },
  { value: 'boyard',  label: 'Boyard' },
] as const;

export default function Setup() {
  const completeSetup = useUI((s) => s.completeSetup);
  const [shopName, setShopName] = useState('Мебельный цех');
  const [supplier, setSupplier] = useState<SupplierId>('imkon');
  const [thickness, setThickness] = useState<Thickness>(16);
  const [hardware, setHardware] = useState<HardwareBrand>('hettich');

  const onStart = () => {
    completeSetup({
      shopName: shopName.trim() || 'Мебельный цех',
      defaultSupplier: supplier,
      defaultThickness: thickness,
      defaultHardware: hardware,
    });
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Настроим ваш цех</Text>
          <Text style={styles.subtitle}>
            Эти настройки применятся ко всем будущим кухням
          </Text>
        </View>

        <WizardField label="Название цеха">
          <TextInput
            value={shopName}
            onChangeText={setShopName}
            placeholder="Мебельный цех"
            placeholderTextColor={COLORS.inkFaint}
            style={styles.input}
          />
        </WizardField>

        <WizardField label="Поставщик ЛДСП">
          <WizardChoice<SupplierId> value={supplier} options={SUPPLIERS} onChange={setSupplier} />
        </WizardField>

        <WizardField label="Толщина ЛДСП" hint="Используется по умолчанию для корпусов">
          <WizardChoice<Thickness> value={thickness} options={THICKNESSES} onChange={setThickness} />
        </WizardField>

        <WizardField label="Бренд фурнитуры" hint="Можно поменять для каждой кухни">
          <WizardChoice<HardwareBrand> value={hardware} options={HARDWARE} onChange={setHardware} />
        </WizardField>
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable onPress={onStart} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}>
          <Text style={styles.ctaTxt}>Начать работу</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACE.xl, paddingBottom: SPACE.xxxl },
  header: { marginBottom: SPACE.xl, gap: SPACE.xs },
  title: { ...TYPE.bodyMed, color: COLORS.ink, fontSize: 22 },
  subtitle: { ...TYPE.body, color: COLORS.inkMuted, fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md + 2,
    ...TYPE.body,
    color: COLORS.ink,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    ...SHADOWS.sm,
  },
  bottom: { padding: SPACE.lg },
  cta: {
    backgroundColor: COLORS.ink,
    borderRadius: RADII.lg,
    paddingVertical: SPACE.lg + 2,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  ctaTxt: { ...TYPE.bodyMed, color: '#fff', fontSize: 16 },
});
