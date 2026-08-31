import type { GameSettings, Player, Role } from '@clocktower/shared';
import { getActiveRoles } from '@clocktower/shared';
import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';

export function buildGameScriptRoles(
  players: Player[],
  settings?: Pick<
    GameSettings,
    'setupEditionId' | 'additionalRoleIds' | 'excludedRoleIds'
  > | null,
): Role[] {
  const roles = getActiveRoles({
    editionId: settings?.setupEditionId ?? 'trouble_brewing',
    additionalRoleIds: settings?.additionalRoleIds ?? [],
    excludedRoleIds: settings?.excludedRoleIds ?? [],
  });
  const roleById = new Map(roles.map((role) => [role.id, role]));

  for (const player of players) {
    if (!player.isTraveller || !player.role) continue;
    roleById.set(player.role.id, player.role);
  }

  return [...roleById.values()];
}

/**
 * 현재 게임 설정의 기본 에디션, 추가 역할, 참가 중인 여행자 역할만 반환한다.
 */
export function useGameEditionRoles(players: Player[]): Role[] {
  const settings = useGameStore((s) => s.gameState?.settings);
  return useMemo(() => {
    return buildGameScriptRoles(players, settings);
  }, [players, settings]);
}
