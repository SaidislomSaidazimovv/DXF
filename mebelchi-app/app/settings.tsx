/**
 * Settings — HANDOVER §4.6. Visible-only this sprint.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUI } from '@/store/uiStore';
import { useT } from '@/lib/i18n';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.7 }]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {!!value && <Text style={styles.rowValue}>{value}</Text>}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function Settings() {
  const shopName = useUI((s) => s.shopName);
  const language = useUI((s) => s.language);
  const setLanguage = useUI((s) => s.setLanguage);
  const defaultSupplier = useUI((s) => s.defaultSupplier);
  const defaultThickness = useUI((s) => s.defaultThickness);
  const defaultHardware = useUI((s) => s.defaultHardware);
  const t = useT();

  const supplierLabel: Record<typeof defaultSupplier, string> = {
    imkon: 'Imkon Group',
    egger_uz: 'Egger UZ',
    kronospan_uz: 'Kronospan UZ',
  };
  const hardwareLabel: Record<typeof defaultHardware, string> = {
    blum: 'Blum',
    hettich: 'Hettich',
    boyard: 'Boyard',
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={styles.backTxt}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t('settings_title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACE.lg, paddingBottom: SPACE.xxxl }}>
        <Section title={t('settings_shop')}>
          <Row label={t('settings_name')} value={shopName} onPress={() => {}} />
          <Row label={t('setup_supplier')} value={supplierLabel[defaultSupplier]} onPress={() => {}} />
          <Row label={t('setup_thickness')} value={defaultThickness + ' ' + t('unit_mm')} onPress={() => {}} />
          <Row label={t('setup_hardware')} value={hardwareLabel[defaultHardware]} onPress={() => {}} />
        </Section>

        <Section title={t('settings_lang')}>
          <View style={styles.langRow}>
            {(['ru', 'uz'] as const).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLanguage(l)}
                style={({ pressed }) => [
                  styles.langChip,
                  language === l && styles.langChipActive,
                  pressed && language !== l && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.langTxt, language === l && styles.langTxtActive]}>
                  {l === 'ru' ? t('lang_ru') : t('lang_uz')}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title={t('settings_about')}>
          <Row label={t('settings_version')} value="1.0 MVP" />
          <Row label={t('settings_build')} value={new Date().toISOString().slice(0, 10)} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  back: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.bgCardTint,
    alignItems: 'center', justifyContent: 'center',
  },
  backTxt: { color: COLORS.ink, fontSize: 22, marginTop: -4 },
  title: { ...TYPE.bodyMed, color: COLORS.ink, fontSize: 17 },
  section: { marginBottom: SPACE.xl },
  sectionTitle: { ...TYPE.sectionLabel, color: COLORS.inkMuted, marginBottom: SPACE.sm, paddingHorizontal: SPACE.md },
  sectionBody: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  rowLabel: { ...TYPE.body, color: COLORS.ink, fontSize: 14 },
  rowValue: { ...TYPE.body, color: COLORS.inkMuted, fontSize: 14 },
  langRow: { flexDirection: 'row', gap: SPACE.sm, padding: SPACE.md },
  langChip: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm + 2,
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
  },
  langChipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  langTxt: { ...TYPE.pillButton, color: COLORS.inkSoft },
  langTxtActive: { color: '#fff' },
});
