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
  return (
    <>
      {showStartReveal && role && (
        <GameStartReveal
          role={role}
          evilInfo={evilInfo}
          onDismiss={onDismissStartReveal}
        />
      )}

      {rolePromotion && !showStartReveal && (
        <RolePromotionReveal
          role={rolePromotion}
          onDismiss={onDismissRolePromotion}
        />
      )}

      {justDied && (
        <DeathOverlay onDismiss={onDismissDeath} reason={deathReason} />
      )}

      {executionAnnouncement &&
        !justDied &&
        !(currentPhase === 'ended' && gameResult) && (
          <ExecutionOverlay
            announcement={executionAnnouncement}
            onDismiss={onDismissExecution}
          />
        )}

      {showNightFall && <NightFallOverlay onDismiss={onDismissNightFall} />}

      {showRavenkeeper && (
        <RavenkeeperOverlay onDismiss={onDismissRavenkeeper} />
      )}

      {nightDeathAnnouncement && !justDied && !executionAnnouncement && (
        <NightDeathOverlay
          deaths={nightDeathAnnouncement}
          onDismiss={onDismissNightDeath}
        />
      )}

      {slayerFizzle && !justDied && !executionAnnouncement && (
        <SlayerFizzleOverlay
          slayerName={slayerFizzle.slayerName}
          targetName={slayerFizzle.targetName}
          isVotePhase={currentPhase === 'vote'}
          onDismiss={onDismissSlayerFizzle}
        />
      )}

      {currentPhase === 'ended' && gameResult && role && !gameEndDismissed && (
        <GameEndOverlay
          gameResult={gameResult}
          myTeam={myTeam as 'townsfolk' | 'outsider' | 'minion' | 'demon'}
          onDismiss={onDismissGameEnd}
        />
      )}
    </>
  );
}
