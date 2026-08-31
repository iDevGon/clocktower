import type {
  DeathReason,
  ExecutionAnnouncement,
  GameResult,
  Role,
} from '@clocktower/shared';
import type { EvilInfo } from '../stores/playerStore';
import { DeathOverlay } from './DeathOverlay';
import { ExecutionOverlay } from './ExecutionOverlay';
import { GameEndOverlay } from './GameEndOverlay';
import { GameStartReveal } from './GameStartReveal';
import { selectGameOverlay } from './gameOverlayPresentation';
import { NightDeathOverlay } from './NightDeathOverlay';
import { NightFallOverlay } from './NightFallOverlay';
import { RavenkeeperOverlay } from './RavenkeeperOverlay';
import { RolePromotionReveal } from './RolePromotionReveal';
import { SlayerFizzleOverlay } from './SlayerFizzleOverlay';

interface GameOverlaysProps {
  // Game start reveal
  showStartReveal: boolean;
  role: Role | null;
  evilInfo?: EvilInfo | null;
  onDismissStartReveal: () => void;

  // Role promotion
  rolePromotion: Role | null;
  onDismissRolePromotion: () => void;

  // Death
  justDied: boolean;
  deathReason: DeathReason | null;
  onDismissDeath: () => void;

  // Execution
  executionAnnouncement: ExecutionAnnouncement | null;
  currentPhase: string | null;
  gameResult: GameResult | null;
  onDismissExecution: () => void;

  // Night fall
  showNightFall: boolean;
  onDismissNightFall: () => void;

  // Ravenkeeper
  showRavenkeeper: boolean;
  onDismissRavenkeeper: () => void;

  // Night death announcement
  nightDeathAnnouncement: Array<{ id: string; name: string }> | null;
  onDismissNightDeath: () => void;

  // Slayer fizzle
  slayerFizzle: { slayerName: string; targetName: string } | null;
  onDismissSlayerFizzle: () => void;

  // Game end
  gameEndDismissed: boolean;
  myTeam: string | undefined;
  onDismissGameEnd: () => void;
}

export function GameOverlays({
  showStartReveal,
  role,
  evilInfo,
  onDismissStartReveal,
  rolePromotion,
  onDismissRolePromotion,
  justDied,
  deathReason,
  onDismissDeath,
  executionAnnouncement,
  currentPhase,
  gameResult,
  onDismissExecution,
  showNightFall,
  onDismissNightFall,
  showRavenkeeper,
  onDismissRavenkeeper,
  nightDeathAnnouncement,
  onDismissNightDeath,
  slayerFizzle,
  onDismissSlayerFizzle,
  gameEndDismissed,
  myTeam,
  onDismissGameEnd,
}: GameOverlaysProps) {
  const overlay = selectGameOverlay({
    currentPhase,
    gameResult: gameResult !== null,
    role: role !== null,
    gameEndDismissed,
    showStartReveal,
    rolePromotion: rolePromotion !== null,
    justDied,
    executionAnnouncement: executionAnnouncement !== null,
    showNightFall,
    showRavenkeeper,
    nightDeaths: nightDeathAnnouncement !== null,
    slayerFizzle: slayerFizzle !== null,
  });

  switch (overlay) {
    case 'game_end':
      return gameResult ? (
        <GameEndOverlay
          gameResult={gameResult}
          myTeam={myTeam as 'townsfolk' | 'outsider' | 'minion' | 'demon'}
          onDismiss={onDismissGameEnd}
        />
      ) : null;
    case 'start_reveal':
      return role ? (
        <GameStartReveal
          role={role}
          evilInfo={evilInfo}
          onDismiss={onDismissStartReveal}
        />
      ) : null;
    case 'role_promotion':
      return rolePromotion ? (
        <RolePromotionReveal
          role={rolePromotion}
          onDismiss={onDismissRolePromotion}
        />
      ) : null;
    case 'death':
      return <DeathOverlay onDismiss={onDismissDeath} reason={deathReason} />;
    case 'execution':
      return executionAnnouncement ? (
        <ExecutionOverlay
          announcement={executionAnnouncement}
          onDismiss={onDismissExecution}
        />
      ) : null;
    case 'night_fall':
      return <NightFallOverlay onDismiss={onDismissNightFall} />;
    case 'ravenkeeper':
      return <RavenkeeperOverlay onDismiss={onDismissRavenkeeper} />;
    case 'night_deaths':
      return nightDeathAnnouncement ? (
        <NightDeathOverlay
          deaths={nightDeathAnnouncement}
          onDismiss={onDismissNightDeath}
        />
      ) : null;
    case 'slayer_fizzle':
      return slayerFizzle ? (
        <SlayerFizzleOverlay
          slayerName={slayerFizzle.slayerName}
          targetName={slayerFizzle.targetName}
          isVotePhase={currentPhase === 'vote'}
          onDismiss={onDismissSlayerFizzle}
        />
      ) : null;
    case 'none':
      return null;
  }
}
