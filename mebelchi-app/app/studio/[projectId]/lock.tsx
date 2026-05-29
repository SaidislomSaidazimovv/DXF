/**
 * Lock / quote screen — HANDOVER §4.5.
 * Hero parallax + breakdown + share buttons.
 */
import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUI } from '@/store/uiStore';
import { mockPrice, priceBreakdown } from '@/lib/pricing';
import { materialById } from '@/mocks/materials';
import { Canvas3D } from '@/components/studio/scene/Canvas3D';
import { useT } from '@/lib/i18n';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '@/lib/tokens';

function fmt(n: number) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ');
}

export default function Lock() {
  const wallMm = useUI((s) => s.wallLengthMm);
  const variantIdx = useUI((s) => s.variantIdx);
  const globalMat = useUI((s) => s.globalMaterial);
  const selectCabinet = useUI((s) => s.selectCabinet);
  const setViewMode = useUI((s) => s.setViewMode);
  const setHeroMode = useUI((s) => s.setHeroMode);

  const total = useMemo(() => mockPrice(wallMm, variantIdx, globalMat), [wallMm, variantIdx, globalMat]);
  const breakdown = useMemo(() => priceBreakdown(total), [total]);
  const mat = materialById(globalMat);
  const t = useT();

  /* Hero shot — deselect, force 3D, enable turntable in CameraRig.
     On unmount: disable turntable so Studio camera resumes normal behavior. */
  useEffect(() => {
    selectCabinet(null);
    setViewMode('3d');
    setHeroMode(true);
    return () => setHeroMode(false);
  }, [selectCabinet, setViewMode, setHeroMode]);

  return (
    <View style={styles.root}>
      {/* Real 3D kitchen in the background — slow turntable orbit (CameraRig).
          pointerEvents none so the Lock card wins taps. */}
      <View pointerEvents="none" style={styles.hero}>
        <Canvas3D />
      </View>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        {/* Back button */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <Text style={styles.backTxt}>‹</Text>
          </Pressable>
        </View>

        {/* Spacer to push card down */}
        <View style={{ flex: 1 }} />

        {/* Bottom card */}
        <View style={styles.card}>
          <View style={styles.heroPriceRow}>
            <Text style={styles.heroPrice}>{fmt(total)}</Text>
            <Text style={styles.heroCur}>{t('currency')}</Text>
          </View>
          <Text style={styles.meta}>{wallMm} {t('unit_mm')} · {t('variant').toLowerCase()} {variantIdx + 1} · {mat.name}</Text>

          <View style={styles.divider} />

          {[
            { label: t('lock_ldsp'),     value: breakdown.ldsp },
            { label: t('lock_hardware'), value: breakdown.hardware },
            { label: t('lock_edge'),     value: breakdown.edge },
            { label: t('lock_labor'),    value: breakdown.labor },
          ].map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowVal}>{fmt(row.value)} {t('currency')}</Text>
            </View>
          ))}

          <View style={styles.utilBox}>
            <Text style={styles.utilLabel}>{t('lock_usage')}</Text>
            <View style={styles.utilBar}>
              <View style={[styles.utilFill, { width: '87%' }]} />
            </View>
            <Text style={styles.utilPct}>87%</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => { /* TODO: PDF share — mock toast */ }}
              style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.btnGhostTxt}>{t('lock_share_pdf')}</Text>
            </Pressable>
            <Pressable
              onPress={() => { /* TODO: Telegram share — mock toast */ }}
              style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
            >
              <Text style={styles.btnPrimaryTxt}>{t('lock_send_tg')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  hero: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject },
  topBar: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.sm },
  back: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm,
  },
  backTxt: { color: '#fff', fontSize: 22, marginTop: -4 },
  card: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACE.xl,
    paddingTop: SPACE.lg,
    gap: SPACE.sm,
    ...SHADOWS.xl,
  },
  heroPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE.sm, marginTop: SPACE.xs },
  heroPrice: { ...TYPE.heroPrice, color: COLORS.ink },
  heroCur: { ...TYPE.priceCur, color: COLORS.inkMuted, fontSize: 14 },
  meta: { ...TYPE.body, color: COLORS.inkMuted, fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.line, marginVertical: SPACE.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { ...TYPE.body, color: COLORS.inkSoft, fontSize: 13 },
  rowVal: { ...TYPE.body, color: COLORS.ink, fontSize: 13, fontFamily: 'monospace' },
  utilBox: { marginTop: SPACE.md, marginBottom: SPACE.sm },
  utilLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted, marginBottom: SPACE.xs },
  utilBar: { height: 6, borderRadius: 3, backgroundColor: COLORS.line, overflow: 'hidden' },
  utilFill: { height: '100%', backgroundColor: COLORS.ink },
  utilPct: { ...TYPE.body, color: COLORS.ink, fontSize: 12, marginTop: SPACE.xs, fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.md },
  btnGhost: {
    flex: 1,
    paddingVertical: SPACE.md + 2,
    alignItems: 'center',
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bgCard,
  },
  btnGhostTxt: { ...TYPE.pillButton, color: COLORS.ink, fontSize: 13 },
  btnPrimary: {
    flex: 1.4,
    paddingVertical: SPACE.md + 2,
    alignItems: 'center',
    borderRadius: RADII.lg,
    backgroundColor: COLORS.ink,
    ...SHADOWS.md,
  },
  btnPrimaryTxt: { ...TYPE.pillButton, color: '#fff', fontSize: 13 },
});
