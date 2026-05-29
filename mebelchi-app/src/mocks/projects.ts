/**
 * Sample recent projects — V2 (includes currentPhase + updatedAt).
 */
import type { ProjectSummary } from '@/types/ui';

export const SAMPLE_PROJECTS: ProjectSummary[] = [
  {
    id: 'p_demo_1',
    name: 'Кухня Каримова',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    wallLengthMm: 2400,
    totalPriceSum: 12_480_000,
    thumbnailColor: 'cashmere',
    currentPhase: 'F',
  },
  {
    id: 'p_demo_2',
    name: 'Студия 35 м²',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    wallLengthMm: 1800,
    totalPriceSum: 7_120_000,
    thumbnailColor: 'oak_light',
    currentPhase: 'D',
  },
  {
    id: 'p_demo_3',
    name: 'Холостяцкая',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    wallLengthMm: 1500,
    totalPriceSum: 5_280_000,
    thumbnailColor: 'anthracite',
    currentPhase: 'C',
  },
];

export function generateProjectId(): string {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}
