export type PhaseBarVariant = 'default' | 'rail';

export const PHASE_BAR_RAIL_LAYOUT = {
  orientation: 'vertical',
  phaseStepCount: 4,
  primaryActionMinHeight: 104,
  phaseStepMinHeight: 42,
  secondaryActionMinHeight: 30,
  secondaryActionWidth: 'full',
  secondaryActionPosition: 'abovePrimary',
  secondaryActionProminence: 'quiet',
  shortcutLabel: 'Space',
} as const;
