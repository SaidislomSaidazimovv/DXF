/**
 * PhaseStepper — A→B→C→D→E→F chip header.
 *
 * Visible at the top of every Phase screen. Each chip:
 *   • shows the phase letter
 *   • is tappable: navigates to that phase if it's reachable
 *     (current phase OR a previously-completed earlier phase)
 *   • has 3 visual states: done (filled ink), current (outlined ink),
 *     locked (faint).
 *
 * Per HANDOVER §3 the stepper is also a soft progress meter.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUI } from '@/store/uiStore';
import { COLORS, SPACE, TYPE } from '@/lib/tokens';
import { hapticTap } from '@/lib/haptics';
import type { Phase } from '@/types/ui';
import { phaseLabel } from '@/types/ui';

/** Phase boundary rules — when we leave THIS phase going backward, what
 *  state is invalidated and what extra confirmation copy do we show?
 *
 *  HANDOVER §10 (Phase B acceptance): "Going back from Phase C → B clears
 *  the confirmation (with prompt)." We generalise: any backward jump that
 *  crosses a completed phase clears that phase's commitment.
 */
const PHASE_REWIND_NOTE: Record<Phase, string | undefined> = {
  A: 'Геометрия и ограничения останутся.',
  B: 'Согласование с клиентом будет сброшено — нужно будет повторить «Показать клиенту».',
  C: 'Материалы и фурнитура останутся, но варианты могут перегенерироваться.',
  D: 'Усилители и фурнитура останутся.',
  E: 'Применённые советы останутся.',
  F: undefined,
};

const PHASES: Phase[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export function PhaseStepper() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const currentPhase = useUI((s) => s.currentPhase);
  const phaseCompletion = useUI((s) => s.phaseCompletion);
  const lang = useUI((s) => s.language);
  const setPhase = useUI((s) => s.setPhase);

  const canGoTo = (p: Phase): boolean => {
    if (p === currentPhase) return true;
    /* Can revisit any earlier phase */
    const cur = PHASES.indexOf(currentPhase);
    const tgt = PHASES.indexOf(p);
    if (tgt < cur) return true;
    /* Can jump forward only if all phases up to target-1 are done */
    for (let i = 0; i < tgt; i++) {
      if (!phaseCompletion[PHASES[i]]) return false;
    }
    return true;
  };

  const goTo = (p: Phase, rewindCrossedB: boolean) => {
    hapticTap();
    /* If we crossed Phase B going backward (e.g. C → B or D → A), drop
       the customer confirmation. The mebelchi must re-show + re-confirm. */
    if (rewindCrossedB) {
      useUI.getState().clearCustomerConfirmation();
    }
    setPhase(p);
    router.replace(`/studio/${projectId}/phase${p}`);
  };

  const onTap = (p: Phase) => {
    if (!canGoTo(p)) return;
    if (p === currentPhase) return;
    const cur = PHASES.indexOf(currentPhase);
    const tgt = PHASES.indexOf(p);
    /* Going backward to an earlier phase — warn (HANDOVER §2 global rules) */
    if (tgt < cur) {
      const note = PHASE_REWIND_NOTE[p] ?? '';
      const crossesB = cur > PHASES.indexOf('B') && tgt <= PHASES.indexOf('B');
      Alert.alert(
        'Вернуться?',
        `Вы вернётесь на этап ${p} — ${phaseLabel(p, lang)}. ${note}`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Вернуться', style: 'destructive', onPress: () => goTo(p, crossesB) },
        ],
      );
      return;
    }
    goTo(p, false);
  };

  return (
    <View style={styles.row}>
      {PHASES.map((p, i) => {
        const isCurrent = p === currentPhase;
        const isDone = phaseCompletion[p];
        const isReachable = canGoTo(p);
        return (
          <React.Fragment key={p}>
            <Pressable
              onPress={() => onTap(p)}
              hitSlop={6}
              style={[
                styles.chip,
                isDone && styles.chipDone,
                isCurrent && styles.chipCurrent,
                !isReachable && styles.chipLocked,
              ]}
            >
              <Text
                style={[
                  styles.letter,
                  isDone && styles.letterDone,
                  isCurrent && styles.letterCurrent,
                  !isReachable && styles.letterLocked,
                ]}
              >
                {p}
              </Text>
              {isCurrent && (
                <Text style={styles.currentLabel}>{phaseLabel(p, lang)}</Text>
              )}
            </Pressable>
            {i < PHASES.length - 1 && (
              <View
                style={[
                  styles.connector,
                  isDone && styles.connectorDone,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const CHIP = 22;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.xs,
  },
  chip: {
    minWidth: CHIP,
    height: CHIP,
    borderRadius: CHIP / 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: COLORS.lineStrong ?? COLORS.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  chipDone: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  chipCurrent: {
    backgroundColor: 'transparent',
    borderColor: COLORS.ink,
    borderWidth: 1.5,
    paddingHorizontal: 10,
  },
  chipLocked: { opacity: 0.35 },
  letter: { ...TYPE.brandLogo, fontSize: 11, color: COLORS.inkSoft, letterSpacing: 0 },
  letterDone:    { color: '#fff' },
  letterCurrent: { color: COLORS.ink },
  letterLocked:  { color: COLORS.inkFaint },
  currentLabel: {
    ...TYPE.brandLogo,
    fontSize: 10,
    color: COLORS.ink,
    letterSpacing: 1,
    marginLeft: 6,
  },
  connector: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.line,
    marginHorizontal: 4,
  },
  connectorDone: { backgroundColor: COLORS.ink },
});
