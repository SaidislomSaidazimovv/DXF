/**
 * Home — recent projects + new kitchen CTA.
 * HANDOVER §4.2.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUI } from '@/store/uiStore';
import { useT } from '@/lib/i18n';
import { ProjectCard } from '@/components/home/ProjectCard';
import { NewKitchenButton } from '@/components/home/NewKitchenButton';
import { COLORS, SPACE, TYPE } from '@/lib/tokens';

export default function Home() {
  const recentProjects = useUI((s) => s.recentProjects);
  const createNewProject = useUI((s) => s.createNewProject);
  const t = useT();

  const onNewKitchen = () => {
    const id = createNewProject();
    /* New kitchen always starts at Phase A (Discovery). */
    router.push(`/studio/${id}/phaseA`);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>MEBELCHI</Text>
          <Text style={styles.tag}>{t('brand_tag_home')}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          style={({ pressed }) => [styles.gear, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.gearTxt}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: SPACE.xxxl }}>
        {/* Recent projects */}
        <Text style={styles.sectionLabel}>{t('home_recent')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.projectsRow}
        >
          {recentProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onPress={() => router.push(`/studio/${p.id}`)}
            />
          ))}
        </ScrollView>

        {/* Tip block */}
        <View style={styles.tip}>
          <Text style={styles.tipTitle}>{t('home_tip_title')}</Text>
          <Text style={styles.tipBody}>{t('home_tip_body')}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <NewKitchenButton onPress={onNewKitchen} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { ...TYPE.brandLogo, color: COLORS.ink, fontSize: 18, letterSpacing: 1.6 },
  tag:   { ...TYPE.brandTag,  color: COLORS.inkMuted, marginTop: 2 },
  gear: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bgCardTint, alignItems: 'center', justifyContent: 'center',
  },
  gearTxt: { fontSize: 18, color: COLORS.inkSoft },
  sectionLabel: { ...TYPE.sectionLabel, color: COLORS.inkMuted, paddingHorizontal: SPACE.xl, marginTop: SPACE.md, marginBottom: SPACE.md },
  projectsRow: {
    paddingHorizontal: SPACE.xl,
    gap: SPACE.md,
  },
  tip: {
    margin: SPACE.xl,
    padding: SPACE.lg,
    backgroundColor: COLORS.bgSoft,
    borderRadius: 18,
    gap: SPACE.xs,
  },
  tipTitle: { ...TYPE.bodyMed, color: COLORS.ink, fontSize: 14 },
  tipBody:  { ...TYPE.body,   color: COLORS.inkMuted, lineHeight: 18 },
  bottom: {
    padding: SPACE.lg,
    paddingBottom: SPACE.xl,
  },
});
