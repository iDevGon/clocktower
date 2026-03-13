import type { ComponentProps } from 'react';
import { EdgeVignette } from './EdgeVignette';

type Colors = ComponentProps<typeof EdgeVignette>['colors'];

const DEAD_COLORS: Colors = {
  top: {
    stops: [
      'rgba(70,8,8,0.95)',
      'rgba(50,6,6,0.6)',
      'rgba(35,4,4,0.3)',
      'rgba(20,2,2,0.1)',
      'transparent',
    ],
    locations: [0, 0.2, 0.45, 0.7, 1],
  },
  bottom: {
    stops: [
      'rgba(55,6,6,0.9)',
      'rgba(40,5,5,0.55)',
      'rgba(28,3,3,0.25)',
      'rgba(15,2,2,0.08)',
      'transparent',
    ],
    locations: [0, 0.2, 0.45, 0.7, 1],
  },
  side: {
    stops: [
      'rgba(55,6,6,0.8)',
      'rgba(38,4,4,0.4)',
      'rgba(22,3,3,0.15)',
      'transparent',
    ],
    locations: [0, 0.3, 0.6, 1],
  },
  corner: 'rgba(60,5,5,0.7)',
  borderColor: 'rgba(120,18,18,0.25)',
};

const DEAD_OPACITY_RANGES = {
  top: [0.5, 0.7] as [number, number],
  bottom: [0.4, 0.6] as [number, number],
  side: [0.3, 0.5] as [number, number],
  border: [0.15, 0.35] as [number, number],
};

/**
 * Persistent red vignette overlay shown when the player is dead.
 * Smoky dark-red haze creeps in from edges with a slow breathing pulse.
 */
export function DeadVignette() {
  return (
    <EdgeVignette
      colors={DEAD_COLORS}
      opacityRanges={DEAD_OPACITY_RANGES}
      duration={3500}
    />
  );
}
