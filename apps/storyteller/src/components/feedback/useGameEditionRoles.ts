import type { GameSettings, Player, Role } from '@clocktower/shared';
import { EDITION_ROLES, getRoleById } from '@clocktower/shared';
import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';

export function buildGameScriptRoles(
  players: Player[],
  settings?: Pick<GameSettings, 'setupEditionId' | 'additionalRoleIds'> | null,
): Role[] {
  const roleById = new Map<string, Role>();
  const setupEditionId = settings?.setupEditionId ?? 'trouble_brewing';

  for (const role of EDITION_ROLES[setupEditionId] ??
    EDITION_ROLES.trouble_brewing) {
    roleById.set(role.id, role);
  }

  for (const roleId of settings?.additionalRoleIds ?? []) {
    const role = getRoleById(roleId);
    if (role) roleById.set(role.id, role);
  }

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
