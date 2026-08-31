import type { DeathReason, ExecutionAnnouncement } from '@clocktower/shared';

export type GameOverlayKey =
  | 'game_end'
  | 'start_reveal'
  | 'role_promotion'
  | 'death'
  | 'execution'
  | 'night_fall'
  | 'ravenkeeper'
  | 'night_deaths'
  | 'slayer_fizzle'
  | 'none';

interface GameOverlayPresentation {
  currentPhase?: string | null;
  gameResult?: boolean;
  role?: boolean;
  gameEndDismissed?: boolean;
  showStartReveal?: boolean;
  rolePromotion?: boolean;
  justDied?: boolean;
  deathReason?: DeathReason | null;
  executionAnnouncement?: boolean;
  executionReason?: ExecutionAnnouncement['reason'] | null;
  showNightFall?: boolean;
  showRavenkeeper?: boolean;
  nightDeaths?: boolean;
  slayerFizzle?: boolean;
}

export function selectGameOverlay({
  currentPhase,
  gameResult = false,
  role = false,
  gameEndDismissed = false,
  showStartReveal = false,
  rolePromotion = false,
  justDied = false,
  deathReason = null,
  executionAnnouncement = false,
  executionReason = null,
  showNightFall = false,
  showRavenkeeper = false,
  nightDeaths = false,
  slayerFizzle = false,
}: GameOverlayPresentation): GameOverlayKey {
  const gameHasEnded = currentPhase === 'ended' && gameResult;

  if (gameHasEnded && role && !gameEndDismissed) return 'game_end';
  if (showStartReveal && role) return 'start_reveal';
  if (rolePromotion) return 'role_promotion';
  if (justDied) {
    return currentPhase === 'vote' && deathReason === 'slayer'
      ? 'none'
      : 'death';
  }
  if (executionAnnouncement && !gameHasEnded) {
    return currentPhase === 'vote' && executionReason === 'slayer'
      ? 'none'
      : 'execution';
  }
  if (showNightFall) return 'night_fall';
  if (showRavenkeeper) return 'ravenkeeper';
  if (nightDeaths) return 'night_deaths';
  if (slayerFizzle) {
    return currentPhase === 'vote' ? 'none' : 'slayer_fizzle';
  }
  return 'none';
}

interface PersonalDeathPresentationPatch {
  justDied: false;
  deathReason: null;
  nightDeathAnnouncement: Array<{ id: string; name: string }> | null;
}

export function dismissPersonalDeathPresentation(
  setPresentation: (patch: PersonalDeathPresentationPatch) => void,
  playerId: string,
  nightDeathAnnouncement: Array<{ id: string; name: string }> | null,
): void {
  const otherNightDeaths =
    nightDeathAnnouncement?.filter((death) => death.id !== playerId) ?? [];
  setPresentation({
    justDied: false,
    deathReason: null,
    nightDeathAnnouncement:
      otherNightDeaths.length > 0 ? otherNightDeaths : null,
  });
}
