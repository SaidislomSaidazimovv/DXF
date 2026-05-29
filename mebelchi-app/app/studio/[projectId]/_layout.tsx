/**
 * Studio (project) layout — V2 phase routing.
 *
 * The actual phase chrome (PhaseStepper, headers) lives inside each phase
 * screen so each phase can fully theme its background (e.g. Phase D's
 * darker workshop tone, Phase F's near-white pro tone).
 */
import React from 'react';
import { Stack } from 'expo-router';

export default function StudioLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 320,
      }}
    />
  );
}
