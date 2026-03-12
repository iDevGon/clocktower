import { EdgeVignette } from './EdgeVignette';

const DEAD_COLORS = {
  top: [
    { offset: '0%', size: '40%', color: 'rgba(80,10,10,0.9)' },
    { offset: '40%', size: '30%', color: 'rgba(50,8,8,0.5)' },
    { offset: '70%', size: '30%', color: 'rgba(30,5,5,0.2)' },
  ],
  bottom: [
    { offset: '0%', size: '40%', color: 'rgba(60,8,8,0.85)' },
    { offset: '40%', size: '30%', color: 'rgba(40,6,6,0.45)' },
    { offset: '70%', size: '30%', color: 'rgba(25,4,4,0.15)' },
  ],
  side: [
    { offset: '0%', size: '50%', color: 'rgba(60,8,8,0.7)' },
    { offset: '50%', size: '50%', color: 'rgba(30,5,5,0.2)' },
  ],
  borderColor: 'rgba(139,20,20,0.5)',
} as const;

const DEAD_OPACITY_RANGES = {
  top: [0.55, 0.75] as [number, number],
  bottom: [0.45, 0.65] as [number, number],
  side: [0.35, 0.55] as [number, number],
  border: [0.3, 0.6] as [number, number],
};

/**
 * Persistent red vignette overlay shown when the player is dead.
 * Dark-red edges around the screen with a slow pulse animation.
 */
export function DeadVignette() {
  return (
    <EdgeVignette
      colors={DEAD_COLORS}
      opacityRanges={DEAD_OPACITY_RANGES}
      duration={3000}
    />
  );
}
