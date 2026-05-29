/**
 * Phase B — LAYOUT (Planirovka).
 *
 * Goal: pick a variant that satisfies the wall + constraints from Phase A,
 * show it to the customer in a cinematic mode, get verbal agreement, save
 * confirmation (screenshot + timestamp), then move on to Phase C.
 *
 * "Show to customer" ceremony (HANDOVER §4):
 *   - tap "Показать клиенту"
 *   - chrome fades to 0 over 320ms
 *   - heroMode activates (CameraRig turntable parallax)
 *   - "← Закрыть" pill appears top-left after 1s
 *   - "Клиент согласен — продолжить" pill appears bottom-center after 3s
 *   - tap green → saveCustomerConfirmation + advance to C
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router, useLocalSearchParams } from 'expo-router';
import { useUI, selectCurrentVariant } from '@/store/uiStore';
import { PriceBlock } from '@/components/studio/PriceBlock';
import { ViewToggle } from '@/components/studio/ViewToggle';
import { VariantDots } from '@/components/studio/VariantDots';
import { AdjacencyWarning } from '@/components/studio/AdjacencyWarning';
import { StudioBottomBar } from '@/components/studio/StudioBottomBar';
import { Canvas3D } from '@/components/studio/scene/Canvas3D';
import { SelectionPill } from '@/components/studio/SelectionPill';
import { MaterialDrawer } from '@/components/studio/MaterialDrawer';
import { PhaseStepper } from '@/components/phase/PhaseStepper';
import { COLORS, SPACE, TYPE, RADII } from '@/lib/tokens';
import { mockPrice } from '@/lib/pricing';
import { useT } from '@/lib/i18n';
import { hapticTap } from '@/lib/haptics';

export default function PhaseB() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const wallMm = useUI((s) => s.wallLengthMm);
  const variantIdx = useUI((s) => s.variantIdx);
  const variants = useUI((s) => s.variants);
  const variant = useUI(selectCurrentVariant);
  const viewMode = useUI((s) => s.viewMode);
  const globalMat = useUI((s) => s.globalMaterial);
  const confirmation = useUI((s) => s.customerConfirmation);

  const cycleVariant = useUI((s) => s.cycleVariant);
  const setViewMode = useUI((s) => s.setViewMode);
  const saveCurrentProject = useUI((s) => s.saveCurrentProject);
  const saveConfirmation = useUI((s) => s.saveCustomerConfirmation);
  const markPhaseComplete = useUI((s) => s.markPhaseComplete);
  const setPhase = useUI((s) => s.setPhase);
  const setHeroMode = useUI((s) => s.setHeroMode);
  const selectCabinet = useUI((s) => s.selectCabinet);

  /* Horizontal swipe — variant cycle. Suppressed if selection active OR
     during customer ceremony. */
  const swipePan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-50, 50])
        .runOnJS(true)
        .onEnd((e) => {
          const s = useUI.getState();
          if (s.selectedCabinetId !== null || s.heroMode) return;
          if (e.translationX < -50) { hapticTap(); cycleVariant(1); }
          else if (e.translationX > 50) { hapticTap(); cycleVariant(-1); }
        }),
    [cycleVariant]
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ceremony, setCeremony] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showAgree, setShowAgree] = useState(false);
  const t = useT();

  /* Chrome fade — Animated.Value 0..1 (1 = fully visible) */
  const chromeOpacity = useRef(new Animated.Value(1)).current;

  const price = useMemo(
    () => mockPrice(wallMm, variantIdx, globalMat),
    [wallMm, variantIdx, globalMat]
  );

  const hasAdjacencyWarning = useMemo(() => {
    if (!variant) return false;
    for (let i = 0; i < variant.cabinets.length - 1; i++) {
      const a = variant.cabinets[i].type;
      const b = variant.cabinets[i + 1].type;
      if ((a === 'sink' && b === 'stove') || (a === 'stove' && b === 'sink')) return true;
    }
    return false;
  }, [variant]);

  /* Enter ceremony: deselect, fade chrome, activate heroMode, schedule pills. */
  const enterCeremony = () => {
    hapticTap();
    selectCabinet(null);
    setCeremony(true);
    setHeroMode(true);
    Animated.timing(chromeOpacity, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const exitCeremony = () => {
    hapticTap();
    setShowClose(false);
    setShowAgree(false);
    setHeroMode(false);
    Animated.timing(chromeOpacity, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setCeremony(false));
  };

  /* Stagger pills in / clear timers on exit */
  useEffect(() => {
    if (!ceremony) {
      setShowClose(false);
      setShowAgree(false);
      return;
    }
    const t1 = setTimeout(() => setShowClose(true), 1000);
    const t2 = setTimeout(() => setShowAgree(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [ceremony]);

  const onCustomerAgrees = () => {
    hapticTap();
    saveConfirmation(variant?.name ?? `Вариант ${variantIdx + 1}`);
    markPhaseComplete('B');
    saveCurrentProject();
    /* Exit hero mode and advance */
    setHeroMode(false);
    setCeremony(false);
    Animated.timing(chromeOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
    router.replace(`/studio/${projectId}/phaseC`);
  };

  const onAdvanceToC = () => {
    hapticTap();
    markPhaseComplete('B');
    setPhase('C');
    saveCurrentProject();
    router.replace(`/studio/${projectId}/phaseC`);
  };

  /* Clean heroMode on unmount in case user navigates away mid-ceremony */
  useEffect(() => {
    return () => { setHeroMode(false); };
  }, [setHeroMode]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Animated.View style={{ opacity: chromeOpacity }} pointerEvents={ceremony ? 'none' : 'auto'}>
        <PhaseStepper />

        <View style={styles.topRow}>
          <View>
            <Text style={styles.brand}>MEBELCHI</Text>
            <Text style={styles.tag}>{t('brand_tag_studio')}</Text>
          </View>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </View>

        {/* Wall length is set in Phase A — no mm shown here, only price */}
        <View style={styles.chromeRowEnd}>
          <PriceBlock sum={price} />
        </View>

        <View style={styles.dotsRow}>
          <VariantDots count={variants.length} activeIdx={variantIdx} />
        </View>

        <View style={styles.warnRow}>
          <AdjacencyWarning visible={hasAdjacencyWarning} />
        </View>
      </Animated.View>

      <GestureDetector gesture={swipePan}>
        <View collapsable={false} style={{ flex: 1 }}>
          <Canvas3D />
        </View>
      </GestureDetector>

      {!ceremony && <SelectionPill />}

      {/* Ceremony overlay pills */}
      {ceremony && showClose && (
        <Pressable onPress={exitCeremony} style={styles.closePill} hitSlop={10}>
          <Text style={styles.closeTxt}>← Закрыть</Text>
        </Pressable>
      )}
      {ceremony && showAgree && (
        <View style={styles.agreeWrap} pointerEvents="box-none">
          <Pressable onPress={onCustomerAgrees} style={styles.agreeBtn}>
            <Text style={styles.agreeTxt}>Клиент согласен — продолжить</Text>
          </Pressable>
        </View>
      )}

      {/* Confirmation / show-customer ribbon */}
      <Animated.View style={{ opacity: chromeOpacity }} pointerEvents={ceremony ? 'none' : 'auto'}>
        {confirmation ? (
          <View style={styles.confirmedRibbon}>
            <Text style={styles.confirmedTxt}>
              ✓ Согласовано · {confirmation.variantName}
            </Text>
            <Pressable onPress={onAdvanceToC} hitSlop={8} style={styles.advance}>
              <Text style={styles.advanceTxt}>К настройке →</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.confirmRow}>
            <Pressable onPress={enterCeremony} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnTxt}>Показать клиенту →</Text>
            </Pressable>
          </View>
        )}

        <StudioBottomBar
          variantIdx={variantIdx}
          variantCount={variants.length}
          onOpenMaterial={() => { hapticTap(); setDrawerOpen(true); }}
          onSave={() => {
            hapticTap();
            saveCurrentProject();
          }}
          onCycleVariant={() => { hapticTap(); cycleVariant(1); }}
        />
      </Animated.View>

      <MaterialDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xs,
    paddingBottom: SPACE.xs,
  },
  brand: { ...TYPE.brandLogo, color: COLORS.ink, fontSize: 13, letterSpacing: 1.5 },
  tag:   { ...TYPE.brandTag,  color: COLORS.inkFaint, marginTop: 1 },
  chromeRowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xs,
  },
  dotsRow: { paddingTop: SPACE.sm, paddingBottom: SPACE.xs },
  warnRow: { minHeight: 22, justifyContent: 'center' },
  confirmRow: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.xs,
    alignItems: 'center',
  },
  confirmBtn: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink,
  },
  confirmBtnTxt: { ...TYPE.bodyMed, color: '#fff', letterSpacing: 0.3 },
  confirmedRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    backgroundColor: COLORS.goodBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.good,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.good,
  },
  confirmedTxt: { ...TYPE.body, color: COLORS.good },
  advance: { paddingHorizontal: SPACE.sm, paddingVertical: 4 },
  advanceTxt: { ...TYPE.bodyMed, color: COLORS.good },

  /* Ceremony pills */
  closePill: {
    position: 'absolute',
    top: SPACE.lg + 24,
    left: SPACE.lg,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  closeTxt: { ...TYPE.bodyMed, color: COLORS.ink },
  agreeWrap: {
    position: 'absolute',
    bottom: SPACE.xl + 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  agreeBtn: {
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.md,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.good,
  },
  agreeTxt: { ...TYPE.bodyMed, color: '#fff', fontSize: 16, letterSpacing: 0.4 },
});
