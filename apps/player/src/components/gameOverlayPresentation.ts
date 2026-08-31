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
  executionAnnouncement?: boolean;
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
  executionAnnouncement = false,
  showNightFall = false,
  showRavenkeeper = false,
  nightDeaths = false,
  slayerFizzle = false,
}: GameOverlayPresentation): GameOverlayKey {
  const gameHasEnded = currentPhase === 'ended' && gameResult;

  if (gameHasEnded && role && !gameEndDismissed) return 'game_end';
  if (showStartReveal && role) return 'start_reveal';
  if (rolePromotion) return 'role_promotion';
  if (justDied) return 'death';
  if (executionAnnouncement && !gameHasEnded) return 'execution';
  if (showNightFall) return 'night_fall';
  if (showRavenkeeper) return 'ravenkeeper';
  if (nightDeaths) return 'night_deaths';
  if (slayerFizzle) return 'slayer_fizzle';
  return 'none';
}

interface PersonalDeathPresentationPatch {
  justDied: false;
  deathReason: null;
  nightDeathAnnouncement: null;
}

export function dismissPersonalDeathPresentation(
  setPresentation: (patch: PersonalDeathPresentationPatch) => void,
): void {
  setPresentation({
    justDied: false,
    deathReason: null,
    nightDeathAnnouncement: null,
  });
}
