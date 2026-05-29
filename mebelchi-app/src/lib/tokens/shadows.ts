/**
 * Shadows — RN cross-platform.
 * iOS uses shadow*; Android uses elevation.
 */
export const SHADOWS = {
  sm: {
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  md: {
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  lg: {
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
  },
  xl: {
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 20 },
  },
} as const;
