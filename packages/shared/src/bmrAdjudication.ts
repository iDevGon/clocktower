import { hasPoisonStatus, type Player, type PlayerStatus } from './types.js';

export type BmrDeathTiming = 'day' | 'night';

export type BmrDeathMethod =
  | 'execution'
  | 'demon'
  | 'assassin'
  | 'godfather'
  | 'gossip'
  | 'gambler'
  | 'tinker'
  | 'moonchild'
  | 'grandmother'
  | 'pukka_delayed'
  | 'shabaloth'
  | 'po'
  | 'manual';

export type BmrDeathWarningSeverity = 'block' | 'choice' | 'bypass' | 'info';

export type BmrDeathWarningKind =
  | 'actor_malfunctioning'
  | 'assassin_bypasses_protection'
  | 'sailor_cannot_die'
  | 'innkeeper_protected'
  | 'devils_advocate_protected'
  | 'tea_lady_protected'
  | 'fool_first_death'
  | 'zombuul_registers_dead';

export interface BmrDeathWarning {
  kind: BmrDeathWarningKind;
  severity: BmrDeathWarningSeverity;
  message: string;
}

export interface BmrDeathWarningContext {
  roleId: string;
  method: BmrDeathMethod;
  timing: BmrDeathTiming;
  actor?: Pick<Player, 'role' | 'statuses'> | null;
  target?: Pick<Player, 'role' | 'statuses'> | null;
  targetStatuses?: PlayerStatus[];
}

function isSoberHealthy(player?: Pick<Player, 'role' | 'statuses'> | null) {
  if (!player) return false;
  return (
    player.role?.id === 'beggar' ||
    player.statuses.includes('barista_sober_healthy')
  );
}

function isAbilityMalfunctioning(
  player?: Pick<Player, 'role' | 'statuses'> | null,
): boolean {
  if (!player || isSoberHealthy(player)) return false;
  return (
    player.role?.id === 'drunk' ||
    player.statuses.includes('drunk') ||
    hasPoisonStatus(player.statuses)
  );
}

function statusesOf(
  player: Pick<Player, 'statuses'> | null | undefined,
  override: PlayerStatus[] | undefined,
): PlayerStatus[] {
  return override ?? player?.statuses ?? [];
}

function hasProtectionStatus(statuses: PlayerStatus[]): boolean {
  return (
    statuses.includes('protected') ||
    statuses.includes('innkeeper_protected') ||
    statuses.includes('devils_advocate_protected') ||
    statuses.includes('tea_lady_protected')
  );
}

export function getBmrDeathWarnings({
  method,
  timing,
  actor,
  target,
  targetStatuses,
}: BmrDeathWarningContext): BmrDeathWarning[] {
  const warnings: BmrDeathWarning[] = [];
  const statuses = statusesOf(target, targetStatuses);

  if (isAbilityMalfunctioning(actor)) {
    warnings.push({
      kind: 'actor_malfunctioning',
      severity: 'block',
      message: '행동자가 중독/취함 상태라 이 사망 능력은 처리하지 않습니다.',
    });
    return warnings;
  }

  if (method === 'assassin') {
    if (hasProtectionStatus(statuses)) {
      warnings.push({
        kind: 'assassin_bypasses_protection',
        severity: 'bypass',
        message: '암살자는 보호로 사망할 수 없는 대상도 죽일 수 있습니다.',
      });
    }
    return warnings;
  }

  if (
    target?.role?.id === 'sailor' &&
    !isAbilityMalfunctioning(target) &&
    !statuses.includes('sailor_drunk')
  ) {
    warnings.push({
      kind: 'sailor_cannot_die',
      severity: 'block',
      message: '맑고 건강한 선원은 사망하지 않습니다.',
    });
  }

  if (timing === 'night' && statuses.includes('innkeeper_protected')) {
    warnings.push({
      kind: 'innkeeper_protected',
      severity: 'block',
      message: '여관 주인 보호 대상은 오늘 밤 사망하지 않습니다.',
    });
  }

  if (
    timing === 'day' &&
    method === 'execution' &&
    statuses.includes('devils_advocate_protected')
  ) {
    warnings.push({
      kind: 'devils_advocate_protected',
      severity: 'block',
      message: '처형은 성공하지만 악마의 변호사 보호로 대상은 생존합니다.',
    });
  }

  if (statuses.includes('tea_lady_protected')) {
    warnings.push({
      kind: 'tea_lady_protected',
      severity: 'block',
      message: '찻집 여인 조건으로 이 대상은 사망하지 않을 수 있습니다.',
    });
  }

  if (
    target?.role?.id === 'fool' &&
    !isAbilityMalfunctioning(target) &&
    !statuses.includes('fool_spent') &&
    !statuses.includes('no_ability')
  ) {
    warnings.push({
      kind: 'fool_first_death',
      severity: 'choice',
      message: '어릿광대의 첫 사망 방지 능력을 소모하고 생존할 수 있습니다.',
    });
  }

  if (
    target?.role?.id === 'zombuul' &&
    !statuses.includes('zombuul_registers_dead')
  ) {
    warnings.push({
      kind: 'zombuul_registers_dead',
      severity: 'choice',
      message:
        '좀비얼의 첫 사망은 실제 사망 대신 사망한 것으로 위장될 수 있습니다.',
    });
  }

  return warnings;
}
