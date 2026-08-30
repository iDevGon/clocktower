import {
  type GameSettings,
  getActiveRoles,
  getBaseRoleCounts,
  getNightOrderForEdition,
  getRoleById,
  getRolesForEdition,
  type Role,
  type Team,
} from '@clocktower/shared';

type BaseTeam = Exclude<Team, 'traveller'>;

const BASE_TEAMS: Array<{ team: BaseTeam; label: string }> = [
  { team: 'townsfolk', label: '마을주민' },
  { team: 'outsider', label: '외지인' },
  { team: 'minion', label: '하수인' },
  { team: 'demon', label: '악마' },
];

type DictionarySettings = Pick<
  GameSettings,
  'setupEditionId' | 'excludedRoleIds' | 'additionalRoleIds'
>;

export function buildDictionarySetup({
  settings,
  players,
  fallbackEditionId,
}: {
  settings?: DictionarySettings | null;
  players?: readonly { isTraveller?: boolean }[] | null;
  fallbackEditionId?: string;
}) {
  const editionId = settings?.setupEditionId ?? fallbackEditionId;
  const roleIds = editionId
    ? getActiveRoles({
        editionId,
        excludedRoleIds: settings?.excludedRoleIds,
        additionalRoleIds: settings?.additionalRoleIds,
      }).map((role) => role.id)
    : [];

  return {
    editionId,
    roleIds,
    regularPlayerCount:
      players && players.length > 0
        ? players.filter((player) => !player.isTraveller).length
        : undefined,
  };
}

export function getDictionaryNightRoles(
  editionId: string | undefined,
  activeRoleIds: readonly string[] | undefined,
  day: number,
): Role[] {
  const flowEditionId = editionId ?? 'trouble_brewing';
  const roleIds =
    activeRoleIds ??
    getActiveRoles({ editionId: flowEditionId }).map((role) => role.id);
  const baseRoleIds = new Set(
    getRolesForEdition(flowEditionId).map((role) => role.id),
  );
  const allowedRoleIds = new Set(roleIds);
  const additionalRoleIds = roleIds.filter(
    (roleId) => !baseRoleIds.has(roleId),
  );

  return getNightOrderForEdition(flowEditionId, day, additionalRoleIds)
    .filter((roleId) => allowedRoleIds.has(roleId))
    .map((roleId) => getRoleById(roleId))
    .filter((role): role is Role => Boolean(role));
}

export type DictionaryComposition =
  | {
      status: 'supported';
      title: string;
      description: string;
      teamCounts: Array<{ team: BaseTeam; label: string; count: number }>;
    }
  | { status: 'unsupported' | 'unknown'; title: string; description: string };

export function getDictionaryComposition(
  regularPlayerCount?: number,
): DictionaryComposition {
  if (regularPlayerCount == null) {
    return {
      status: 'unknown',
      title: '일반 참가자 수를 확인할 수 없습니다.',
      description:
        '여행자를 제외한 현재 참가자 수가 확인되면 기본 인원 구성을 표시합니다.',
    };
  }

  const roleCounts = getBaseRoleCounts(regularPlayerCount);
  if (!roleCounts) {
    return {
      status: 'unsupported',
      title: '이 일반 참가자 수의 기본 인원 구성은 지원하지 않습니다.',
      description:
        '기본 인원 구성은 일반 참가자 5명부터 20명까지 확인할 수 있습니다.',
    };
  }

  return {
    status: 'supported',
    title: `일반 참가자 ${regularPlayerCount}명 기본 구성`,
    description:
      '역할 능력으로 인한 인원 변동은 반영하지 않은 기본 구성입니다.',
    teamCounts: BASE_TEAMS.map(({ team, label }) => ({
      team,
      label,
      count: roleCounts[team],
    })),
  };
}
