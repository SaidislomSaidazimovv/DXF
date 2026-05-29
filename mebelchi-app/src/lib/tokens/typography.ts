/**
 * Typography tokens.
 *
 * For V1 ship: HANDOVER §8 specifies IBM Plex Sans + Mono (Cyrillic).
 * To wire them up later:
 *   npm i @expo-google-fonts/ibm-plex-sans @expo-google-fonts/ibm-plex-mono
 *   load via useFonts() in app/_layout.tsx
 *   then replace these values with the imported font names
 *     (e.g. IBMPlexSans_500Medium).
 *
 * For now: system fallback. Cyrillic still renders correctly on Android+iOS.
 */
export const FONTS = {
  sans: undefined as string | undefined,
  sansMedium: undefined as string | undefined,
  sansSemibold: undefined as string | undefined,
  mono: 'monospace' as string,
  monoMedium: 'monospace' as string,
} as const;

/**
 * Text sizes — from HANDOVER §8.
 * Use { fontFamily, fontSize, fontWeight, ... } directly in StyleSheet.
 */
export const TYPE = {
  brandLogo:    { fontFamily: FONTS.sansSemibold, fontSize: 14, letterSpacing: 0.6 },
  brandTag:     { fontFamily: FONTS.sans,         fontSize: 10, letterSpacing: 1.4 },
  wallPill:     { fontFamily: FONTS.sansMedium,   fontSize: 17 },
  price:        { fontFamily: FONTS.monoMedium,   fontSize: 19 },
  priceCur:     { fontFamily: FONTS.mono,         fontSize: 11 },
  sectionLabel: { fontFamily: FONTS.monoMedium,   fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  body:         { fontFamily: FONTS.sans,         fontSize: 13 },
  bodyMed:      { fontFamily: FONTS.sansMedium,   fontSize: 13 },
  pillButton:   { fontFamily: FONTS.sansMedium,   fontSize: 14 },
  toast:        { fontFamily: FONTS.sansMedium,   fontSize: 12 },
  hint:         { fontFamily: FONTS.sans,         fontSize: 11, fontStyle: 'italic' as const },
  heroPrice:    { fontFamily: FONTS.monoMedium,   fontSize: 32 },
} as const;
