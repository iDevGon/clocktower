import type { ComponentProps } from 'react';
import { EdgeVignette } from './EdgeVignette';

type Colors = ComponentProps<typeof EdgeVignette>['colors'];

const DEAD_COLORS: Colors = {
  top: {
    stops: [
      'rgba(20,35,60,0.98)',
      'rgba(15,28,50,0.75)',
      'rgba(10,22,42,0.45)',
      'rgba(8,18,35,0.2)',
      'transparent',
    ],
    locations: [0, 0.25, 0.5, 0.75, 1],
  },
  bottom: {
    stops: [
      'rgba(18,30,55,0.95)',
      'rgba(12,25,48,0.7)',
      'rgba(8,20,40,0.4)',
      'rgba(5,15,32,0.15)',
      'transparent',
    ],
    locations: [0, 0.25, 0.5, 0.75, 1],
  },
  side: {
    stops: [
      'rgba(18,30,55,0.9)',
      'rgba(12,24,45,0.55)',
      'rgba(8,18,38,0.25)',
      'transparent',
    ],
    locations: [0, 0.35, 0.65, 1],
  },
  corner: 'rgba(15,28,52,0.85)',
  borderColor: 'rgba(40,65,110,0.35)',
};

const DEAD_OPACITY_RANGES = {
  top: [0.7, 0.9] as [number, number],
  bottom: [0.6, 0.8] as [number, number],
  side: [0.5, 0.7] as [number, number],
  border: [0.3, 0.5] as [number, number],
};

/**
 * Persistent pale-blue vignette overlay shown when the player is dead.
 * Ghostly cold haze creeps in from edges with a slow breathing pulse.
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
