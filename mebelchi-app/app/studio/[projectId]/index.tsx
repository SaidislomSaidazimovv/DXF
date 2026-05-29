/**
 * Studio index — redirects to the project's current phase.
 *
 * Replaces the V1 single-Studio screen. Phase routing is now the source of
 * truth; this file exists only to translate `/studio/:id` into
 * `/studio/:id/phase{A..F}`.
 */
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useUI } from '@/store/uiStore';

export default function StudioIndex() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const currentPhase = useUI((s) => s.currentPhase);
  return <Redirect href={`/studio/${projectId}/phase${currentPhase}`} />;
}
