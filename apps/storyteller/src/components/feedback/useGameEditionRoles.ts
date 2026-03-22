import type { Player, Role } from '@clocktower/shared';
import { EDITION_ROLES } from '@clocktower/shared';
import { useMemo } from 'react';

/**
 * 현재 게임 플레이어들의 역할에서 에디션을 추론하고,
 * 해당 에디션(들)의 전체 역할 목록을 반환한다.
 * 크로스 에디션 믹싱이 있으면 관련 에디션 역할도 포함.
 */
export function useGameEditionRoles(players: Player[]): Role[] {
  return useMemo(() => {
    const editions = new Set<string>();
    for (const p of players) {
      if (p.role?.edition && !p.isTraveller) {
        editions.add(p.role.edition);
      }
    }
    if (editions.size === 0) editions.add('trouble_brewing');

    const roles: Role[] = [];
    const seen = new Set<string>();
    for (const editionId of editions) {
      for (const role of EDITION_ROLES[editionId] ?? []) {
        if (!seen.has(role.id)) {
          seen.add(role.id);
          roles.push(role);
        }
      }
    }
    return roles;
  }, [players]);
}
