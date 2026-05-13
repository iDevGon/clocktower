import { randomUUID } from 'node:crypto';
import type {
  DaySubPhase,
  ExecutionStatus,
  GameResult,
  GameSettings,
  GameState,
  Nomination,
  Phase,
  Player,
  PlayerStatus,
  Role,
} from '@clocktower/shared/logic';
import {
  DEFAULT_GAME_SETTINGS,
  getRoleById,
  getTravellerById,
  hasPoisonStatus,
  POISON_STATUSES,
  SECTS_AND_VIOLETS_ROLES,
} from '@clocktower/shared/logic';

type BaristaEffect = 'sober_healthy' | 'acts_twice';

const TEMPORARY_TRAVELLER_STATUSES: PlayerStatus[] = [
  'bone_collector_ability',
  'barista_sober_healthy',
  'barista_acts_twice',
];

function isSoberHealthy(player: Player): boolean {
  return (
    player.role?.id === 'beggar' ||
    player.statuses.includes('barista_sober_healthy')
  );
}

/** 플레이어가 중독 또는 취함 상태인지 확인 (능력 무효화 판정용) */
function isPoisonedOrDrunk(player: Player): boolean {
  if (isSoberHealthy(player)) return false;
  return hasPoisonStatus(player.statuses) || player.statuses.includes('drunk');
}

function filterSoberHealthyBlockedStatuses(
  player: Player,
  statuses: PlayerStatus[],
): PlayerStatus[] {
  const unique = [...new Set(statuses)];
  const soberHealthy =
    player.role?.id === 'beggar' || unique.includes('barista_sober_healthy');
  if (!soberHealthy) return unique;
  return unique.filter(
    (status) => status !== 'drunk' && !POISON_STATUSES.includes(status),
  );
}

function isPubliclyAlive(player: Player): boolean {
  return player.isAlive && !player.statuses.includes('zombuul_registers_dead');
}

/**
 * 정보 능력에서 플레이어가 악으로 감지되는지 판정합니다.
 * - 은둔자(outsider) + misregistered → 악으로 감지
 * - 첩자(minion) + misregistered → 선으로 감지
 * - 그 외 → 실제 진영 기준
 */
function isDetectedAsEvil(player: Player): boolean {
  const actualEvil =
    player.alignment != null
      ? player.alignment === 'evil'
      : player.role?.team === 'minion' || player.role?.team === 'demon';
  if (!player.statuses.includes('misregistered')) return actualEvil;

  // 은둔자: 선 → 악으로 위장
  if (player.role?.id === 'recluse') return true;
  // 첩자: 악 → 선으로 위장
  if (player.role?.id === 'spy') return false;

  return actualEvil;
}

export class GameManager {
  private state: GameState = {
    id: '',
    phase: 'setup',
    daySubPhase: null,
    day: 0,
    players: [],
    nominations: [],
    started: false,
    playerOrder: [],
    settings: { ...DEFAULT_GAME_SETTINGS },
  };

  // 시계방향 투표 관련 상태
  private voteClockInterval: ReturnType<typeof setInterval> | null = null;
  private voteCountdownTimeout: ReturnType<typeof setTimeout> | null = null;
  // 투표 프리셀렉트 (토글): 시계 바늘이 지나갈 때 확정됨
  private votePreselections = new Map<string, boolean>();

  // 집사의 주인 추적 (butlerPlayerId → masterPlayerId)
  private butlerMasters = new Map<string, string>();
  // 밤 행동 타깃 추적 (playerId → targetIds) — 임프 자해 감지용
  private nightActionTargets = new Map<string, string[]>();
  // 사냥꾼 능력 사용 추적
  private slayerUsed = new Set<string>();
  // 화가 능력 사용 추적 (게임 중 1회)
  private artistUsed = new Set<string>();
  // 백치천재 능력 사용 추적 (하루 1회)
  private savantUsedToday = new Set<string>();
  // 철학자 능력 사용 추적 (게임 중 1회)
  private philosopherUsed = new Set<string>();
  // 곡예사 능력 사용 추적 (게임 중 1회) + 추측 저장 (밤 피드백 정답 수 계산용)
  private jugglerUsed = new Set<string>();
  private jugglerGuesses = new Map<
    string,
    Array<{ playerId: string; roleId: string }>
  >();
  // 총잡이 능력 사용 추적 (매일 1회) + 오늘 첫 투표 찬성자 (총잡이 대상 제한)
  private gunslingerUsedToday = new Set<string>();
  private todayFirstVoteGuiltyVoters: string[] | null = null;
  // 거지 토큰 개수 (투표 시 소비)
  private beggarTokens = new Map<string, number>();
  // 처단자 선언 확인 추적 (투표 중 일시정지용)
  private slayerAcks = new Set<string>();
  private voteClockPausedNomineeId: string | null = null;
  // 성녀 능력 발동 여부
  private virginTriggered = false;
  // 오늘 처형이 있었는지 (시장 승리 조건용)
  private executionToday = false;
  // 오늘 최다 투표로 처형 대상이 된 플레이어 (투표 비교용)
  private executionCandidate: {
    playerId: string;
    guiltyVotes: number;
  } | null = null;
  // 동률로 처형 대상이 사라진 경우, 이후 투표에서 이 표수를 초과해야 새 처형 대상이 됨
  private executionCandidateThreshold = 0;
  // 유령 투표 사용 추적 (게임 전체에서 1회만 사용 가능)
  private ghostVotesUsed = new Set<string>();
  // 밤 중 사망한 플레이어 (낮 전환 시 알림용)
  private pendingNightKills: string[] = [];
  // 현재 활성 밤 역할 및 순서 (재접속 시 복원용)
  private currentNightRoleId: string | null = null;
  private currentNightOrder: string[] = [];
  // 점쟁이 Red Herring (악마로 감지되는 선한 플레이어)
  private fortuneTellerRedHerring: string | null = null;
  // 탕녀 승계로 역할이 변경된 플레이어 (checkWinCondition 호출 후 소비)
  private lastPromotedPlayer: Player | null = null;
  // 임프 자해 시 지연된 승계 (밤→낮 전환 시 실행)
  private pendingImpPromotion: { minionId: string } | null = null;
  // 밤 역할 겹침 시 순차 wakeUp 대기열 (다음 night:wakeUp 대상 플레이어 ID)
  private nightWakeUpQueue: string[] = [];
  private nightWakeUpRoleId: string | null = null;
  // 변론 중 투표 동의 (ready) 플레이어 추적
  private voteConsentReady = new Set<string>();
  // 지목 타이머 일시정지/재개용 남은 시간 (ms)
  private nominationRemainingMs: number | null = null;
  private nominationStartedAt: number | null = null;
  // 악마에게 전달된 블러프 역할 (이야기꾼 표시용)
  private bluffRoles: { id: string; name: string }[] = [];
  // 이야기꾼이 사전 선택한 블러프 역할 ID (수동 배정 시 사용)
  private preselectedBluffIds: string[] = [];

  // ── 추방 투표 상태 ──
  private exileVote: {
    proposerId: string;
    targetId: string;
    votes: Map<string, boolean>; // playerId → guilty
  } | null = null;

  // ── Sects & Violets 전용 상태 ──
  // 마녀 저주 대상 (witchPlayerId → cursedPlayerId)
  private witchCursedTarget: string | null = null;
  // 팡 구 외지인 교환 발동 여부 (게임당 1회)
  private fangGuJumped = false;
  // 비고르모르티스가 죽여 능력을 유지하는 하수인과 그 독 대상
  private vigormortisRetainedMinions = new Set<string>();
  private vigormortisPoisonTargets = new Map<string, string>();
  // 사악한 쌍둥이 매핑 (evilTwinId → goodTwinId)
  private evilTwinPairs = new Map<string, string>();
  // 푸주한: 첫 처형 후 추가 지명 1회
  private butcherExtraNominationAvailable = false;
  private butcherExtraNominationUsed = false;
  private butcherExtraNominatorId: string | null = null;
  // 뼈 수집가: 게임 중 1회 복구 대상 추적
  private boneCollectorUsed = new Set<string>();
  private boneCollectorRestoredTargets = new Map<string, string>();
  private pendingHarlotConsents = new Map<string, { harlotId: string }>();
  // 현재 에디션 ID (밤 순서 결정에 사용)
  private editionId = 'trouble_brewing';

  private getDefaultAlignmentForRole(
    role: Role | undefined,
  ): 'good' | 'evil' | undefined {
    if (!role) return undefined;
    if (role.team === 'townsfolk' || role.team === 'outsider') return 'good';
    if (role.team === 'minion' || role.team === 'demon') return 'evil';
    return undefined;
  }

  private getEffectiveAlignment(player: Player): 'good' | 'evil' | null {
    if (player.isTraveller) return player.travellerAlignment ?? null;
    return (
      player.alignment ?? this.getDefaultAlignmentForRole(player.role) ?? null
    );
  }

  private addStatus(player: Player, status: PlayerStatus): void {
    if (
      isSoberHealthy(player) &&
      (status === 'drunk' || POISON_STATUSES.includes(status))
    ) {
      return;
    }
    if (!player.statuses.includes(status)) player.statuses.push(status);
    player.statuses = filterSoberHealthyBlockedStatuses(
      player,
      player.statuses,
    );
  }

  private removeStatus(player: Player, status: PlayerStatus): void {
    player.statuses = player.statuses.filter((s) => s !== status);
  }

  private cleanupOnPlayerDeath(player: Player): void {
    if (player.role?.id === 'beggar') {
      this.beggarTokens.delete(player.id);
    }
    if (player.role?.id === 'bone_collector') {
      this.clearBoneCollectorRestoredTarget(player.id);
    }
  }

  private clearBoneCollectorRestoredTarget(boneCollectorId: string): void {
    const targetId = this.boneCollectorRestoredTargets.get(boneCollectorId);
    if (targetId) {
      const target = this.getPlayer(targetId);
      if (target) this.removeStatus(target, 'bone_collector_ability');
    }
    this.boneCollectorRestoredTargets.delete(boneCollectorId);
  }

  private getTownsfolkNeighborIds(sourcePlayerId: string): string[] {
    const order =
      this.state.playerOrder.length > 0
        ? this.state.playerOrder
        : this.state.players.map((p) => p.id);
    const idx = order.indexOf(sourcePlayerId);
    if (idx === -1) return [];

    const neighborIds: string[] = [];
    for (let i = 1; i < order.length; i++) {
      const player = this.getPlayer(order[(idx + i) % order.length]);
      if (player?.role?.team === 'townsfolk') {
        neighborIds.push(player.id);
        break;
      }
    }
    for (let i = 1; i < order.length; i++) {
      const player = this.getPlayer(
        order[(idx - i + order.length) % order.length],
      );
      if (player?.role?.team === 'townsfolk') {
        if (!neighborIds.includes(player.id)) neighborIds.push(player.id);
        break;
      }
    }
    return neighborIds;
  }

  private hasActiveVigormortis(): boolean {
    return this.state.players.some(
      (p) => p.isAlive && p.role?.id === 'vigormortis' && !isPoisonedOrDrunk(p),
    );
  }

  private hasLivingVigormortisRole(): boolean {
    return this.state.players.some(
      (p) => p.isAlive && p.role?.id === 'vigormortis',
    );
  }

  private syncNoDashiiPoisoning(): void {
    for (const player of this.state.players) {
      this.removeStatus(player, 'no_dashii_poisoned');
    }

    for (const noDashii of this.state.players) {
      if (
        noDashii.isAlive &&
        noDashii.role?.id === 'no_dashii' &&
        !isPoisonedOrDrunk(noDashii)
      ) {
        for (const neighborId of this.getNoDashiiPoisonedNeighbors(
          noDashii.id,
        )) {
          const neighbor = this.getPlayer(neighborId);
          if (neighbor) this.addStatus(neighbor, 'no_dashii_poisoned');
        }
      }
    }
  }

  private syncVigormortisPoisoning(): void {
    const hasVigormortis = this.hasActiveVigormortis();
    const hasLivingVigormortisRole = this.hasLivingVigormortisRole();

    for (const player of this.state.players) {
      this.removeStatus(player, 'vigormortis_poisoned');
      if (!hasVigormortis) this.removeStatus(player, 'vigormortis_retained');
    }

    if (!hasLivingVigormortisRole) {
      this.vigormortisRetainedMinions.clear();
      this.vigormortisPoisonTargets.clear();
      return;
    }
    if (!hasVigormortis) return;

    for (const minionId of [...this.vigormortisRetainedMinions]) {
      const minion = this.getPlayer(minionId);
      if (!minion || minion.isAlive || minion.role?.team !== 'minion') {
        this.vigormortisRetainedMinions.delete(minionId);
        this.vigormortisPoisonTargets.delete(minionId);
        if (minion) this.removeStatus(minion, 'vigormortis_retained');
        continue;
      }
      if (isPoisonedOrDrunk(minion)) {
        this.removeStatus(minion, 'vigormortis_retained');
        continue;
      }

      this.addStatus(minion, 'vigormortis_retained');
      const targetId = this.vigormortisPoisonTargets.get(minionId);
      const target = targetId ? this.getPlayer(targetId) : undefined;
      if (target?.role?.team === 'townsfolk') {
        this.addStatus(target, 'vigormortis_poisoned');
      }
    }
  }

  private syncContinuousPoisoning(): void {
    this.syncVigormortisPoisoning();
    this.syncNoDashiiPoisoning();
  }

  create(): string {
    const id = randomUUID().slice(0, 8);
    this.state = {
      id,
      phase: 'setup',
      daySubPhase: null,
      day: 0,
      players: [],
      nominations: [],
      started: false,
      playerOrder: [],
      settings: { ...DEFAULT_GAME_SETTINGS },
    };
    this.butlerMasters.clear();
    this.nightActionTargets.clear();
    this.slayerUsed.clear();
    this.artistUsed.clear();
    this.savantUsedToday.clear();
    this.philosopherUsed.clear();
    this.jugglerUsed.clear();
    this.jugglerGuesses.clear();
    this.gunslingerUsedToday.clear();
    this.todayFirstVoteGuiltyVoters = null;
    this.beggarTokens.clear();
    this.slayerAcks.clear();
    this.voteClockPausedNomineeId = null;
    this.virginTriggered = false;
    this.executionToday = false;
    this.executionCandidateThreshold = 0;
    this.ghostVotesUsed.clear();
    this.pendingNightKills = [];
    this.currentNightRoleId = null;
    this.currentNightOrder = [];
    this.fortuneTellerRedHerring = null;
    this.nightWakeUpQueue = [];
    this.nightWakeUpRoleId = null;
    this.bluffRoles = [];
    this.witchCursedTarget = null;
    this.fangGuJumped = false;
    this.vigormortisRetainedMinions.clear();
    this.vigormortisPoisonTargets.clear();
    this.evilTwinPairs.clear();
    this.butcherExtraNominationAvailable = false;
    this.butcherExtraNominationUsed = false;
    this.butcherExtraNominatorId = null;
    this.boneCollectorUsed.clear();
    this.boneCollectorRestoredTargets.clear();
    this.pendingHarlotConsents.clear();
    this.editionId = 'trouble_brewing';
    this.clearVoteTimer();
    this.clearNominationTimer();
    return id;
  }

  reset(): void {
    this.state = {
      id: '',
      phase: 'setup',
      daySubPhase: null,
      day: 0,
      players: [],
      nominations: [],
      started: false,
      playerOrder: [],
      settings: { ...DEFAULT_GAME_SETTINGS },
    };
    this.clearInternalState();
  }

  /** 플레이어를 유지한 채 게임만 초기화 (새 게임 시작용) */
  restart(): string {
    const id = randomUUID().slice(0, 8);
    const players = this.state.players.map((p) => ({
      ...p,
      role: undefined,
      alignment: undefined,
      drunkAs: undefined,
      isAlive: true,
      hasNominatedToday: false,
      hasBeenNominatedToday: false,
      deadVoteUsed: false,
      statuses: [],
    }));
    this.state = {
      id,
      phase: 'setup',
      daySubPhase: null,
      day: 0,
      players,
      nominations: [],
      started: false,
      playerOrder: players.map((p) => p.id),
      settings: this.state.settings,
    };
    this.clearInternalState();
    return id;
  }

  private clearInternalState(): void {
    this.butlerMasters.clear();
    this.nightActionTargets.clear();
    this.slayerUsed.clear();
    this.artistUsed.clear();
    this.savantUsedToday.clear();
    this.philosopherUsed.clear();
    this.jugglerUsed.clear();
    this.jugglerGuesses.clear();
    this.gunslingerUsedToday.clear();
    this.todayFirstVoteGuiltyVoters = null;
    this.beggarTokens.clear();
    this.slayerAcks.clear();
    this.voteClockPausedNomineeId = null;
    this.virginTriggered = false;
    this.executionToday = false;
    this.executionCandidate = null;
    this.executionCandidateThreshold = 0;
    this.ghostVotesUsed.clear();
    this.pendingNightKills = [];
    this.currentNightRoleId = null;
    this.currentNightOrder = [];
    this.fortuneTellerRedHerring = null;
    this.nightWakeUpQueue = [];
    this.nightWakeUpRoleId = null;
    this.voteConsentReady.clear();
    this.bluffRoles = [];
    this.exileVote = null;
    this.witchCursedTarget = null;
    this.fangGuJumped = false;
    this.vigormortisRetainedMinions.clear();
    this.vigormortisPoisonTargets.clear();
    this.evilTwinPairs.clear();
    this.butcherExtraNominationAvailable = false;
    this.butcherExtraNominationUsed = false;
    this.butcherExtraNominatorId = null;
    this.boneCollectorUsed.clear();
    this.boneCollectorRestoredTargets.clear();
    this.pendingHarlotConsents.clear();
    this.editionId = 'trouble_brewing';
    this.clearVoteTimer();
    this.clearNominationTimer();
  }

  getState(): GameState {
    const butlerMasters: Record<string, string> = {};
    for (const [butlerId, masterId] of this.butlerMasters) {
      butlerMasters[butlerId] = masterId;
    }
    return {
      ...this.state,
      players: this.state.players.map((player) => ({
        ...player,
        isAlive: isPubliclyAlive(player),
      })),
      butlerMasters:
        Object.keys(butlerMasters).length > 0 ? butlerMasters : undefined,
    };
  }

  /** 이야기꾼 전용 상태: 블러프 역할 포함 */
  getStorytellerState(): GameState {
    return {
      ...this.getState(),
      bluffRoles: this.bluffRoles.length > 0 ? this.bluffRoles : undefined,
    };
  }

  setBluffRoles(roles: { id: string; name: string }[]): void {
    this.bluffRoles = roles;
  }

  getBluffRoles(): { id: string; name: string }[] {
    return this.bluffRoles;
  }

  setPreselectedBluffIds(ids: string[]): void {
    this.preselectedBluffIds = ids;
  }

  getPreselectedBluffIds(): string[] | undefined {
    return this.preselectedBluffIds.length > 0
      ? this.preselectedBluffIds
      : undefined;
  }

  clearPreselectedBluffIds(): void {
    this.preselectedBluffIds = [];
  }

  getPlayer(playerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  addPlayer(name: string, isDummy?: boolean): Player | null {
    if (this.state.started) return null;

    const player: Player = {
      id: randomUUID().slice(0, 8),
      name,
      isAlive: true,
      hasNominatedToday: false,
      hasBeenNominatedToday: false,
      deadVoteUsed: false,
      statuses: [],
      ...(isDummy ? { isDummy: true } : {}),
    };
    this.state.players.push(player);
    this.state.playerOrder.push(player.id);
    return player;
  }

  removePlayer(playerId: string): boolean {
    const index = this.state.players.findIndex((p) => p.id === playerId);
    if (index === -1) return false;
    this.cleanupOnPlayerDeath(this.state.players[index]);
    this.state.players.splice(index, 1);
    this.state.playerOrder = this.state.playerOrder.filter(
      (id) => id !== playerId,
    );
    this.syncContinuousPoisoning();
    return true;
  }

  /**
   * 여행자로 게임에 참가합니다. 게임 진행 중에도 참가 가능합니다.
   * 역할 배정은 이야기꾼이 별도로 수행합니다.
   */
  addTraveller(name: string): Player | null {
    const state = this.state;
    if (!state.id) return null;

    const player: Player = {
      id: randomUUID().slice(0, 8),
      name,
      isAlive: true,
      hasNominatedToday: false,
      hasBeenNominatedToday: false,
      deadVoteUsed: false,
      statuses: [],
      isTraveller: true,
    };
    state.players.push(player);
    state.playerOrder.push(player.id);
    return player;
  }

  /**
   * 여행자에게 역할과 진영을 배정합니다.
   */
  assignTravellerRole(
    playerId: string,
    roleId: string,
    alignment: 'good' | 'evil',
  ): boolean {
    const player = this.getPlayer(playerId);
    if (!player || !player.isTraveller) return false;

    const travellerRole = getTravellerById(roleId);
    if (!travellerRole) return false;

    player.role = travellerRole;
    player.travellerAlignment = alignment;
    player.statuses = filterSoberHealthyBlockedStatuses(
      player,
      player.statuses,
    );
    return true;
  }

  /**
   * 여행자를 추방(exile)합니다.
   * 추방은 처형과 다릅니다:
   * - 전체 플레이어(죽은 플레이어 포함)의 과반수 투표가 필요
   * - 처형 횟수에 포함되지 않음
   * - 처형 관련 능력(성자, 성결자 등)이 발동하지 않음
   */
  exileTraveller(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player || !player.isTraveller) return false;

    player.isAlive = false;
    this.cleanupOnPlayerDeath(player);
    this.syncContinuousPoisoning();
    return true;
  }

  // ── 추방 투표 ──

  startExileVote(
    proposerId: string,
    targetId: string,
  ): { success: boolean; error?: string; totalPlayers?: number } {
    if (this.exileVote) {
      return { success: false, error: '이미 추방 투표가 진행 중입니다' };
    }
    if (this.state.phase !== 'day') {
      return { success: false, error: '낮에만 추방을 제안할 수 있습니다' };
    }
    const target = this.getPlayer(targetId);
    if (!target) {
      return { success: false, error: '플레이어를 찾을 수 없습니다' };
    }
    if (!target.isTraveller) {
      return { success: false, error: '여행자만 추방할 수 있습니다' };
    }
    if (!target.isAlive) {
      return { success: false, error: '이미 사망한 여행자입니다' };
    }

    this.exileVote = {
      proposerId,
      targetId,
      votes: new Map(),
    };

    const totalPlayers = this.state.players.length;
    return { success: true, totalPlayers };
  }

  castExileVote(
    playerId: string,
    guilty: boolean,
  ): {
    success: boolean;
    error?: string;
    allVoted?: boolean;
    guiltyCount?: number;
    innocentCount?: number;
  } {
    if (!this.exileVote) {
      return { success: false, error: '추방 투표가 진행 중이 아닙니다' };
    }
    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: '플레이어를 찾을 수 없습니다' };
    }
    if (this.exileVote.votes.has(playerId)) {
      return { success: false, error: '이미 투표했습니다' };
    }

    this.exileVote.votes.set(playerId, guilty);

    let guiltyCount = 0;
    let innocentCount = 0;
    for (const v of this.exileVote.votes.values()) {
      if (v) guiltyCount++;
      else innocentCount++;
    }

    const allVoted = this.exileVote.votes.size === this.state.players.length;
    return { success: true, allVoted, guiltyCount, innocentCount };
  }

  closeExileVote(forceExiled?: boolean): {
    exiled: boolean;
    guiltyCount: number;
    totalPlayers: number;
    targetId: string;
  } | null {
    if (!this.exileVote) return null;

    let guiltyCount = 0;
    for (const v of this.exileVote.votes.values()) {
      if (v) guiltyCount++;
    }
    const totalPlayers = this.state.players.length;
    const exiled =
      forceExiled !== undefined
        ? forceExiled
        : guiltyCount > Math.floor(totalPlayers / 2);

    const targetId = this.exileVote.targetId;
    if (exiled) {
      this.exileTraveller(targetId);
    }

    this.exileVote = null;
    return { exiled, guiltyCount, totalPlayers, targetId };
  }

  getExileVote(): {
    proposerId: string;
    targetId: string;
    votes: Record<string, boolean>;
    guiltyCount: number;
    innocentCount: number;
  } | null {
    if (!this.exileVote) return null;
    const votes: Record<string, boolean> = {};
    let guiltyCount = 0;
    let innocentCount = 0;
    for (const [id, v] of this.exileVote.votes) {
      votes[id] = v;
      if (v) guiltyCount++;
      else innocentCount++;
    }
    return {
      proposerId: this.exileVote.proposerId,
      targetId: this.exileVote.targetId,
      votes,
      guiltyCount,
      innocentCount,
    };
  }

  isExileVoteInProgress(): boolean {
    return this.exileVote !== null;
  }

  /** 여행자를 게임에서 완전히 제거합니다 */
  removeTraveller(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player || !player.isTraveller) return false;

    return this.removePlayer(playerId);
  }

  /** 게임의 모든 여행자 목록 반환 */
  getTravellers(): Player[] {
    return this.state.players.filter((p) => p.isTraveller);
  }

  removeDummyPlayers(): void {
    const dummyIds = new Set(
      this.state.players.filter((p) => p.isDummy).map((p) => p.id),
    );
    this.state.players = this.state.players.filter((p) => !p.isDummy);
    this.state.playerOrder = this.state.playerOrder.filter(
      (id) => !dummyIds.has(id),
    );
  }

  start(): { success: boolean; error?: string } {
    if (this.state.started)
      return { success: false, error: '이미 게임이 시작되었습니다' };
    const regularPlayers = this.state.players.filter((p) => !p.isTraveller);
    if (regularPlayers.length < 5)
      return { success: false, error: '최소 5명의 플레이어가 필요합니다' };
    if (!regularPlayers.every((p) => p.role))
      return { success: false, error: '모든 플레이어에게 역할을 배정해주세요' };

    this.state.started = true;
    this.state.phase = 'night';
    this.state.day = 1;
    this.syncContinuousPoisoning();
    return { success: true };
  }

  setPhase(phase: Phase): void {
    this.state.phase = phase;
    this.state.daySubPhase = null;
    if (phase === 'night') {
      this.state.nominations = [];
      this.nightActionTargets.clear();
      this.executionToday = false;
      this.executionCandidate = null;
      this.executionCandidateThreshold = 0;
      this.butcherExtraNominationAvailable = false;
      this.butcherExtraNominationUsed = false;
      this.butcherExtraNominatorId = null;
      this.boneCollectorRestoredTargets.clear();
      this.pendingHarlotConsents.clear();
      this.pendingNightKills = [];
      // 추방 투표 진행 중이면 취소
      this.exileVote = null;
      // 마녀 저주 초기화 (밤 시작 시)
      this.clearWitchCurse();
      // 총잡이 하루 1회 / 오늘 첫 투표자 기록 리셋
      this.gunslingerUsedToday.clear();
      this.savantUsedToday.clear();
      this.todayFirstVoteGuiltyVoters = null;
      this.state.players.forEach((p) => {
        p.hasNominatedToday = false;
        p.hasBeenNominatedToday = false;
        // 밤 시작 시 중독/보호/세레노버스 광기 상태 자동 제거
        p.statuses = p.statuses.filter(
          (s) =>
            s !== 'poisoned' &&
            s !== 'protected' &&
            s !== 'cerenovus_mad' &&
            !TEMPORARY_TRAVELLER_STATUSES.includes(s),
        );
        p.statuses = filterSoberHealthyBlockedStatuses(p, p.statuses);
      });
      this.syncContinuousPoisoning();
    }
    if (phase === 'day') {
      this.state.day++;
      this.state.daySubPhase = 'whisper';
    }
  }

  setDaySubPhase(subPhase: DaySubPhase): void {
    this.state.daySubPhase = subPhase;
  }

  unassignRole(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (!player) return;
    player.role = undefined;
    player.alignment = undefined;
    player.drunkAs = undefined;
    player.statuses = player.statuses.filter((s) => s !== 'drunk');
    this.syncContinuousPoisoning();
  }

  /** 여행자를 제외한 모든 플레이어의 역할을 해제 */
  unassignAllRoles(): void {
    for (const player of this.state.players) {
      if (player.isTraveller) continue;
      player.role = undefined;
      player.alignment = undefined;
      player.drunkAs = undefined;
      player.statuses = player.statuses.filter((s) => s !== 'drunk');
    }
    this.bluffRoles = [];
    this.preselectedBluffIds = [];
    this.syncContinuousPoisoning();
  }

  assignRole(playerId: string, roleId: string, drunkAs?: string): void {
    const player = this.getPlayer(playerId);
    if (!player) return;

    const registeredRole = getRoleById(roleId);
    const role: Role = registeredRole ?? {
      id: roleId,
      name: roleId,
      team: 'townsfolk',
      ability: '',
      edition: '',
    };
    player.role = role;
    player.alignment = this.getDefaultAlignmentForRole(role);
    player.drunkAs = drunkAs;

    // 주정뱅이는 처음부터 '취함' 상태 자동 부여
    if (roleId === 'drunk') {
      if (!player.statuses.includes('drunk')) {
        player.statuses.push('drunk');
      }
      this.syncContinuousPoisoning();
      return;
    }
    player.statuses = player.statuses.filter((s) => s !== 'drunk');
    this.syncContinuousPoisoning();
  }

  kill(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (player) {
      player.isAlive = false;
      this.cleanupOnPlayerDeath(player);
      this.syncContinuousPoisoning();
    }
  }

  hasPendingNightKill(playerId: string): boolean {
    return this.pendingNightKills.includes(playerId);
  }

  addPendingNightKill(playerId: string): void {
    if (!this.pendingNightKills.includes(playerId)) {
      this.pendingNightKills.push(playerId);
    }
  }

  removePendingNightKill(playerId: string): void {
    this.pendingNightKills = this.pendingNightKills.filter(
      (id) => id !== playerId,
    );
  }

  flushPendingNightKills(): string[] {
    const kills = [...this.pendingNightKills];
    this.pendingNightKills = [];
    return kills;
  }

  /** 밤 역할 겹침 시 순차 wakeUp 대기열 설정 */
  setNightWakeUpQueue(playerIds: string[], roleId: string): void {
    this.nightWakeUpQueue = playerIds;
    this.nightWakeUpRoleId = roleId;
  }

  /** 대기열에서 다음 플레이어 꺼내기 */
  popNightWakeUp(): { playerId: string; roleId: string } | null {
    if (this.nightWakeUpQueue.length === 0 || !this.nightWakeUpRoleId)
      return null;
    const playerId = this.nightWakeUpQueue.shift();
    if (!playerId) return null;
    return { playerId, roleId: this.nightWakeUpRoleId };
  }

  clearNightWakeUpQueue(): void {
    this.nightWakeUpQueue = [];
    this.nightWakeUpRoleId = null;
  }

  revive(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (player) {
      player.isAlive = true;
      this.syncContinuousPoisoning();
    }
  }

  setPlayerStatuses(playerId: string, statuses: PlayerStatus[]): void {
    const player = this.getPlayer(playerId);
    if (!player) return;

    const hadWitchCursed = player.statuses.includes('witch_cursed');
    player.statuses = filterSoberHealthyBlockedStatuses(player, statuses);

    // witch_cursed 상태 추가/제거 시 내부 상태 동기화
    const hasWitchCursedAfter = player.statuses.includes('witch_cursed');
    if (!hadWitchCursed && hasWitchCursedAfter) {
      this.witchCursedTarget = playerId;
    }
    if (
      hadWitchCursed &&
      !hasWitchCursedAfter &&
      this.witchCursedTarget === playerId
    ) {
      this.witchCursedTarget = null;
    }
    this.syncContinuousPoisoning();
  }

  // ── 밤 진행 상태 (재접속 복원용) ──

  setNightProgress(roleId: string | null, order: string[]): void {
    this.currentNightRoleId = roleId;
    this.currentNightOrder = order;
  }

  getNightProgress(): { activeRoleId: string | null; order: string[] } {
    return {
      activeRoleId: this.currentNightRoleId,
      order: this.currentNightOrder,
    };
  }

  // ── 점쟁이 Red Herring ──

  /**
   * 점쟁이가 게임에 있을 때, 선한 플레이어 1명을 Red Herring으로 지정합니다.
   * Red Herring은 점쟁이에게 악마로 감지되며 'cursed' 상태가 부여됩니다.
   */
  assignFortuneTellerRedHerring(): string | null {
    // 기존 red herring의 cursed 상태 제거
    if (this.fortuneTellerRedHerring) {
      const prev = this.getPlayer(this.fortuneTellerRedHerring);
      if (prev) {
        prev.statuses = prev.statuses.filter((s) => s !== 'cursed');
      }
      this.fortuneTellerRedHerring = null;
    }

    // 점쟁이 찾기 (주정뱅이가 점쟁이인 척하는 경우 제외)
    const fortuneTeller = this.state.players.find(
      (p) => p.role?.id === 'fortune_teller',
    );
    if (!fortuneTeller) return null;

    // 선한 플레이어 중 점쟁이 본인을 제외한 후보
    const candidates = this.state.players.filter(
      (p) =>
        p.id !== fortuneTeller.id && this.getEffectiveAlignment(p) === 'good',
    );
    if (candidates.length === 0) return null;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.fortuneTellerRedHerring = chosen.id;
    if (!chosen.statuses.includes('cursed')) {
      chosen.statuses.push('cursed');
    }
    return chosen.id;
  }

  /**
   * 이야기꾼이 직접 Red Herring 대상을 지정합니다.
   */
  setRedHerring(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    // 기존 red herring의 cursed 상태 제거
    if (this.fortuneTellerRedHerring) {
      const prev = this.getPlayer(this.fortuneTellerRedHerring);
      if (prev) {
        prev.statuses = prev.statuses.filter((s) => s !== 'cursed');
      }
    }

    this.fortuneTellerRedHerring = playerId;
    if (!player.statuses.includes('cursed')) {
      player.statuses.push('cursed');
    }
    return true;
  }

  getRedHerringId(): string | null {
    return this.fortuneTellerRedHerring;
  }

  /**
   * 점쟁이 판정: 선택된 2명 중 악마 또는 red herring이 포함되어 있으면 true.
   * actor가 중독/취함이면 결과를 반전합니다.
   * actorId 미지정 시 실제 점쟁이의 상태를 사용 (역호환).
   */
  judgeFortuneTeller(targets: string[], actorId?: string): boolean {
    const actor = actorId
      ? this.getPlayer(actorId)
      : this.state.players.find((p) => p.role?.id === 'fortune_teller');

    const hasDemonOrRedHerring = targets.some((targetId) => {
      const target = this.getPlayer(targetId);
      if (!target) return false;
      // 첩자 위장: misregistered 첩자는 선으로 감지 (악마 판정 회피)
      if (
        target.role?.id === 'spy' &&
        target.statuses.includes('misregistered')
      )
        return false;
      if (target.role?.team === 'demon') return true;
      // 은둔자 위장: misregistered 은둔자는 악마로 감지
      if (
        target.role?.id === 'recluse' &&
        target.statuses.includes('misregistered')
      )
        return true;
      if (targetId === this.fortuneTellerRedHerring) return true;
      return false;
    });

    // 중독/취함 상태면 결과 반전
    if (actor && isPoisonedOrDrunk(actor)) {
      return !hasDemonOrRedHerring;
    }

    return hasDemonOrRedHerring;
  }

  /**
   * 임의의 플레이어(예: 철학자가 점쟁이 능력 부여)에 대해 Red Herring을 배정합니다.
   * 이미 RH가 있으면 그대로 둡니다.
   */
  ensureRedHerringForActor(actorId: string): string | null {
    if (this.fortuneTellerRedHerring) return this.fortuneTellerRedHerring;
    const actor = this.getPlayer(actorId);
    if (!actor) return null;
    const candidates = this.state.players.filter(
      (p) => p.id !== actorId && this.getEffectiveAlignment(p) === 'good',
    );
    if (candidates.length === 0) return null;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.fortuneTellerRedHerring = chosen.id;
    if (!chosen.statuses.includes('cursed')) {
      chosen.statuses.push('cursed');
    }
    return chosen.id;
  }

  // ── 총잡이 능력 ──

  isGunslingerUsedToday(playerId: string): boolean {
    return this.gunslingerUsedToday.has(playerId);
  }

  markGunslingerUsedToday(playerId: string): void {
    this.gunslingerUsedToday.add(playerId);
  }

  /** 오늘 첫 투표에서 찬성(guilty) 표를 던진 플레이어 ID 목록. 투표가 아직이면 null */
  getTodayFirstVoteGuiltyVoters(): string[] | null {
    return this.todayFirstVoteGuiltyVoters
      ? [...this.todayFirstVoteGuiltyVoters]
      : null;
  }

  // ── 거지 토큰 ──

  getBeggarTokens(beggarId: string): number {
    return this.beggarTokens.get(beggarId) ?? 0;
  }

  addBeggarToken(beggarId: string): number {
    const next = (this.beggarTokens.get(beggarId) ?? 0) + 1;
    this.beggarTokens.set(beggarId, next);
    return next;
  }

  /** 토큰 1개 소비. 토큰 없으면 false */
  consumeBeggarToken(beggarId: string): boolean {
    const current = this.beggarTokens.get(beggarId) ?? 0;
    if (current <= 0) return false;
    this.beggarTokens.set(beggarId, current - 1);
    return true;
  }

  // ── 이단 여행자 능력 ──

  restoreBoneCollectorAbility(
    boneCollectorId: string,
    targetPlayerId: string,
  ): boolean {
    const collector = this.getPlayer(boneCollectorId);
    const target = this.getPlayer(targetPlayerId);
    if (
      !collector ||
      !target ||
      !collector.isAlive ||
      !collector.isTraveller ||
      collector.role?.id !== 'bone_collector'
    ) {
      return false;
    }
    if (this.boneCollectorUsed.has(boneCollectorId)) return false;
    if (isPoisonedOrDrunk(collector)) return false;
    if (target.isAlive) return false;
    if (boneCollectorId === targetPlayerId) return false;

    this.boneCollectorUsed.add(boneCollectorId);
    this.addStatus(collector, 'no_ability');
    this.addStatus(target, 'bone_collector_ability');
    this.boneCollectorRestoredTargets.set(boneCollectorId, targetPlayerId);
    return true;
  }

  isBoneCollectorUsed(boneCollectorId: string): boolean {
    return this.boneCollectorUsed.has(boneCollectorId);
  }

  private hasActiveBarista(): boolean {
    return this.state.players.some(
      (p) =>
        p.isAlive &&
        p.isTraveller &&
        p.role?.id === 'barista' &&
        !isPoisonedOrDrunk(p),
    );
  }

  applyBaristaEffect(targetPlayerId: string, effect: BaristaEffect): boolean {
    if (!this.hasActiveBarista()) return false;

    const target = this.getPlayer(targetPlayerId);
    if (!target) return false;

    if (effect === 'sober_healthy') {
      this.addStatus(target, 'barista_sober_healthy');
      target.statuses = filterSoberHealthyBlockedStatuses(
        target,
        target.statuses,
      );
      return true;
    }

    this.addStatus(target, 'barista_acts_twice');
    return true;
  }

  shouldRequestDeviantExileJudgement(): boolean {
    if (!this.exileVote) return false;
    const target = this.getPlayer(this.exileVote.targetId);
    if (!target?.isAlive || target.role?.id !== 'deviant') return false;
    if (isPoisonedOrDrunk(target)) return false;
    let guiltyCount = 0;
    for (const vote of this.exileVote.votes.values()) {
      if (vote) guiltyCount++;
    }
    return guiltyCount > Math.floor(this.state.players.length / 2);
  }

  requestHarlotConsent(
    harlotId: string,
    targetPlayerId: string,
  ): {
    harlot: Player;
    target: Player;
  } | null {
    const harlot = this.getPlayer(harlotId);
    const target = this.getPlayer(targetPlayerId);
    if (
      !harlot ||
      !target ||
      !harlot.isAlive ||
      !target.isAlive ||
      harlotId === targetPlayerId ||
      harlot.role?.id !== 'harlot'
    ) {
      return null;
    }

    this.pendingHarlotConsents.set(targetPlayerId, { harlotId });
    return { harlot, target };
  }

  resolveHarlotConsent(
    targetPlayerId: string,
    harlotId: string,
    accepted: boolean,
  ): {
    harlot: Player;
    target: Player;
    accepted: boolean;
    targetRoleName?: string;
    needsFalseInfo?: boolean;
  } | null {
    const pending = this.pendingHarlotConsents.get(targetPlayerId);
    if (!pending || pending.harlotId !== harlotId) return null;
    this.pendingHarlotConsents.delete(targetPlayerId);

    const harlot = this.getPlayer(harlotId);
    const target = this.getPlayer(targetPlayerId);
    if (!harlot || !target) return null;

    const harlotBlocked = isPoisonedOrDrunk(harlot);

    return {
      harlot,
      target,
      accepted,
      targetRoleName:
        accepted && !harlotBlocked ? (target.role?.name ?? '???') : undefined,
      needsFalseInfo: accepted && harlotBlocked ? true : undefined,
    };
  }

  /** 플레이어 진영 판정: 여행자는 travellerAlignment, 일반은 team으로 */
  getPlayerAlignment(playerId: string): 'good' | 'evil' | null {
    const p = this.getPlayer(playerId);
    if (!p) return null;
    return this.getEffectiveAlignment(p);
  }

  /** 처형 후보와 같은 진영의 살아있는 희생양(본인 제외) 반환 */
  findScapegoatForCandidate(candidateId: string): Player | null {
    const candidateAlignment = this.getPlayerAlignment(candidateId);
    if (!candidateAlignment) return null;
    return (
      this.state.players.find(
        (p) =>
          p.isAlive &&
          p.id !== candidateId &&
          p.role?.id === 'scapegoat' &&
          p.travellerAlignment === candidateAlignment &&
          !isPoisonedOrDrunk(p),
      ) ?? null
    );
  }

  /** 처형 후보를 희생양으로 교체 */
  swapExecutionCandidateToScapegoat(scapegoatId: string): boolean {
    if (!this.executionCandidate) return false;
    const scapegoat = this.getPlayer(scapegoatId);
    if (
      !scapegoat ||
      !scapegoat.isAlive ||
      scapegoat.role?.id !== 'scapegoat' ||
      isPoisonedOrDrunk(scapegoat)
    )
      return false;
    this.executionCandidate = {
      playerId: scapegoatId,
      guiltyVotes: this.executionCandidate.guiltyVotes,
    };
    return true;
  }

  // ── 집사 주인 관리 ──

  setButlerMaster(butlerId: string, masterId: string): void {
    // 이전 주인에게서 'master' 상태 제거 (다른 집사의 주인이 아닌 경우에만)
    const prevMasterId = this.butlerMasters.get(butlerId);
    if (prevMasterId && prevMasterId !== masterId) {
      const stillMasterForOther = [...this.butlerMasters.entries()].some(
        ([bid, mid]) => bid !== butlerId && mid === prevMasterId,
      );
      if (!stillMasterForOther) {
        const prevMaster = this.getPlayer(prevMasterId);
        if (prevMaster) {
          prevMaster.statuses = prevMaster.statuses.filter(
            (s) => s !== 'master',
          );
        }
      }
    }

    this.butlerMasters.set(butlerId, masterId);

    // 새 주인에게 'master' 상태 추가
    const newMaster = this.getPlayer(masterId);
    if (newMaster && !newMaster.statuses.includes('master')) {
      newMaster.statuses.push('master');
    }
  }

  getButlerMaster(butlerId: string): string | undefined {
    return this.butlerMasters.get(butlerId);
  }

  // ── 밤 행동 타깃 기록 (임프 자해 감지용) ──

  recordNightAction(playerId: string, targets: string[]): void {
    this.nightActionTargets.set(playerId, targets);
  }

  resolvePukkaSelection(
    pukkaId: string,
    targetId: string,
  ):
    | {
        success: true;
        blocked: false;
        poisonedTargetId: string;
        killedTargetId?: string;
      }
    | {
        success: false;
        blocked: boolean;
        previousTargetId?: string;
        reason: string;
      } {
    const pukka = this.getPlayer(pukkaId);
    if (!pukka) {
      return {
        success: false,
        blocked: false,
        reason: '푸카를 찾을 수 없습니다',
      };
    }

    const target = this.getPlayer(targetId);
    if (!target) {
      return {
        success: false,
        blocked: false,
        reason: '대상을 찾을 수 없습니다',
      };
    }

    const previousTarget = this.state.players.find((p) =>
      p.statuses.includes('pukka_poisoned'),
    );
    if (isPoisonedOrDrunk(pukka)) {
      return {
        success: false,
        blocked: true,
        ...(previousTarget && { previousTargetId: previousTarget.id }),
        reason: '푸카가 중독/취함 상태입니다',
      };
    }

    if (previousTarget) {
      this.removeStatus(previousTarget, 'pukka_poisoned');
      this.kill(previousTarget.id);
      if (this.state.phase === 'night') {
        this.addPendingNightKill(previousTarget.id);
      }
    }
    this.addStatus(target, 'pukka_poisoned');

    return {
      success: true,
      blocked: false,
      ...(previousTarget && { killedTargetId: previousTarget.id }),
      poisonedTargetId: target.id,
    };
  }

  // ── 도둑/관료 투표 가중치 ──

  /** 도둑(-1)과 관료(3)의 밤 행동 타깃에 따른 투표 가중치 맵 반환 */
  private getVoteMultipliers(): Map<string, number> {
    const multipliers = new Map<string, number>();
    for (const player of this.state.players) {
      if (!player.isAlive || !player.isTraveller || !player.role) continue;
      if (player.role.id !== 'thief' && player.role.id !== 'bureaucrat')
        continue;
      if (isPoisonedOrDrunk(player)) continue;
      const targets = this.nightActionTargets.get(player.id);
      if (!targets || targets.length === 0) continue;
      const targetId = targets[0];
      const current = multipliers.get(targetId) ?? 1;
      if (player.role.id === 'thief') {
        multipliers.set(targetId, -current);
      } else {
        multipliers.set(targetId, current * 3);
      }
    }
    return multipliers;
  }

  // ── 처단자 능력 ──

  isSlayerUsed(playerId: string): boolean {
    return this.slayerUsed.has(playerId);
  }

  markSlayerUsed(playerId: string): void {
    this.slayerUsed.add(playerId);
  }

  // ── 화가 능력 ──

  isArtistUsed(playerId: string): boolean {
    return this.artistUsed.has(playerId);
  }

  markArtistUsed(playerId: string): void {
    this.artistUsed.add(playerId);
  }

  // ── 백치천재 능력 ──

  isSavantUsedToday(playerId: string): boolean {
    return this.savantUsedToday.has(playerId);
  }

  markSavantUsedToday(playerId: string): void {
    this.savantUsedToday.add(playerId);
  }

  // ── 철학자 능력 ──

  isPhilosopherUsed(playerId: string): boolean {
    return this.philosopherUsed.has(playerId);
  }

  markPhilosopherUsed(playerId: string): void {
    this.philosopherUsed.add(playerId);
  }

  // ── 곡예사 능력 ──

  isJugglerUsed(playerId: string): boolean {
    return this.jugglerUsed.has(playerId);
  }

  recordJugglerGuesses(
    playerId: string,
    guesses: Array<{ playerId: string; roleId: string }>,
  ): void {
    this.jugglerUsed.add(playerId);
    this.jugglerGuesses.set(playerId, guesses);
  }

  /** 저장된 곡예사 추측 중 정답 수 (drunk는 drunkAs로 매치). 추측이 없으면 0 */
  judgeJuggler(jugglerId: string): number {
    const guesses = this.jugglerGuesses.get(jugglerId);
    if (!guesses) return 0;
    let count = 0;
    for (const g of guesses) {
      const target = this.getPlayer(g.playerId);
      if (!target?.role) continue;
      const effective =
        target.role.id === 'drunk' && target.drunkAs
          ? target.drunkAs
          : target.role.id;
      if (effective === g.roleId) count++;
    }
    return count;
  }

  /** 특정 역할 ID를 실제로 보유한 플레이어 1명 (drunkAs 보유자도 매치 — 원래 holder 의도) */
  findPlayerByRoleId(roleId: string): Player | undefined {
    return this.state.players.find(
      (p) => p.role?.id === roleId || p.drunkAs === roleId,
    );
  }

  // ── 처형 기록 (시장 승리 조건용) ──

  markExecution(): void {
    const wasExecutionToday = this.executionToday;
    this.executionToday = true;
    if (!wasExecutionToday) {
      this.openButcherExtraNomination();
    }
  }

  hadExecutionToday(): boolean {
    return this.executionToday;
  }

  private findActiveButcher(): Player | undefined {
    return this.state.players.find(
      (p) =>
        p.isAlive &&
        p.isTraveller &&
        p.role?.id === 'butcher_traveller' &&
        !isPoisonedOrDrunk(p),
    );
  }

  private openButcherExtraNomination(): void {
    if (this.butcherExtraNominationUsed) return;
    if (this.butcherExtraNominationAvailable) return;
    const butcher = this.findActiveButcher();
    if (!butcher) return;
    this.butcherExtraNominationAvailable = true;
    this.butcherExtraNominatorId = butcher.id;
  }

  isButcherExtraNominationAvailable(): boolean {
    if (!this.butcherExtraNominationAvailable) return false;
    const butcher = this.butcherExtraNominatorId
      ? this.getPlayer(this.butcherExtraNominatorId)
      : undefined;
    return Boolean(
      butcher?.isAlive &&
        butcher.isTraveller &&
        butcher.role?.id === 'butcher_traveller' &&
        !isPoisonedOrDrunk(butcher),
    );
  }

  getButcherExtraNominator(): Player | null {
    if (!this.isButcherExtraNominationAvailable()) return null;
    return this.getPlayer(this.butcherExtraNominatorId ?? '') ?? null;
  }

  consumeButcherExtraNominationWindow(): void {
    this.executionCandidate = null;
    this.executionCandidateThreshold = 0;
  }

  // ── 성녀 지명 트리거 ──

  nominate(
    nominatorId: string,
    nomineeId: string,
  ): { success: boolean; error?: string; virginKill?: string } {
    const nominator = this.getPlayer(nominatorId);
    const nominee = this.getPlayer(nomineeId);

    if (!nominator || !nominee)
      return { success: false, error: '플레이어를 찾을 수 없습니다' };
    if (!nominator.isAlive)
      return { success: false, error: '사망한 플레이어는 지목할 수 없습니다' };
    const usingButcherExtraNomination =
      this.executionToday &&
      this.isButcherExtraNominationAvailable() &&
      this.butcherExtraNominatorId === nominatorId;
    if (nominator.hasNominatedToday && !usingButcherExtraNomination)
      return { success: false, error: '이미 오늘 지목을 사용했습니다' };
    if (nominee.hasBeenNominatedToday)
      return {
        success: false,
        error: '이미 오늘 지목을 당한 플레이어입니다',
      };
    if (nominatorId === nomineeId)
      return { success: false, error: '자기 자신은 지목할 수 없습니다' };
    if (this.executionToday && !usingButcherExtraNomination)
      return { success: false, error: '오늘 이미 처형이 있었습니다' };

    if (usingButcherExtraNomination) {
      this.butcherExtraNominationAvailable = false;
      this.butcherExtraNominationUsed = true;
      this.butcherExtraNominatorId = null;
      this.executionCandidate = null;
      this.executionCandidateThreshold = 0;
    }

    nominator.hasNominatedToday = true;
    nominee.hasBeenNominatedToday = true;

    // 성녀(Virgin): 처음 지명당하면 능력은 소모된다.
    // 중독/취한 성녀는 처형 효과만 무효화된다.
    let virginKill: string | undefined;
    if (
      !this.virginTriggered &&
      nominee.role?.id === 'virgin' &&
      nominee.isAlive
    ) {
      this.virginTriggered = true;
      if (!isPoisonedOrDrunk(nominee) && nominator.role?.team === 'townsfolk') {
        virginKill = nominatorId;
      }
    }

    const nomination: Nomination = {
      nominatorId,
      nomineeId,
      votes: {},
    };
    this.state.nominations.push(nomination);
    return { success: true, virginKill };
  }

  // ── 집사 투표 제한 포함 ──

  /** 유령(사망) 플레이어가 이미 투표권을 사용했는지 확인 */
  isGhostVoteUsed(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player) return false;
    if (isPubliclyAlive(player)) return false;
    return player.deadVoteUsed || this.ghostVotesUsed.has(playerId);
  }

  castVote(playerId: string): { success: boolean; error?: string } {
    const player = this.getPlayer(playerId);
    if (!player)
      return { success: false, error: '플레이어를 찾을 수 없습니다' };

    // 거지: 투표 토큰이 필요. 토큰이 없으면 투표 불가
    if (player.role?.id === 'beggar' && isPubliclyAlive(player)) {
      if (!this.consumeBeggarToken(playerId)) {
        return {
          success: false,
          error: '투표하려면 투표 토큰이 필요합니다',
        };
      }
    }

    if (!isPubliclyAlive(player)) {
      if (player.deadVoteUsed || this.ghostVotesUsed.has(playerId))
        return {
          success: false,
          error: '사망한 플레이어는 게임당 한 번만 투표할 수 있습니다',
        };
      player.deadVoteUsed = true;
      this.ghostVotesUsed.add(playerId);
    }

    // 집사 투표 제한: 주인이 투표해야만 투표 가능 (중독된 집사는 제한 없음)
    if (this.isButlerRestricted(playerId)) {
      return {
        success: false,
        error: '주인이 투표하지 않았습니다',
      };
    }

    const current = this.state.nominations[this.state.nominations.length - 1];
    if (current) {
      current.votes[playerId] = true;
    }
    return { success: true };
  }

  /** 집사인 플레이어가 투표 제한 상태인지 확인 */
  isButlerRestricted(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player || player.role?.id !== 'butler' || isPoisonedOrDrunk(player)) {
      return false;
    }
    const masterId = this.butlerMasters.get(playerId);
    if (!masterId) return false;
    const current = this.state.nominations[this.state.nominations.length - 1];
    if (!current) return false;
    // 주인이 투표했거나(votes) 손을 들었으면(preselect true) 허용
    if (masterId in current.votes) return false;
    if (this.votePreselections.get(masterId) === true) return false;
    return true;
  }

  returnToNomination(): void {
    this.state.phase = 'day';
    this.state.daySubPhase = 'nomination';
  }

  /** 탕녀 승계로 역할이 변경된 플레이어를 반환하고 내부 상태를 초기화 */
  consumePromotedPlayer(): Player | null {
    const p = this.lastPromotedPlayer;
    this.lastPromotedPlayer = null;
    return p;
  }

  // ── 임프 자해 → 하수인 승계 ──

  handleImpSelfKill(impPlayerId: string): boolean {
    const targets = this.nightActionTargets.get(impPlayerId);
    if (!targets || !targets.includes(impPlayerId)) return false;

    // 살아있는 하수인 중 한 명을 찾아 승계 예약 (낮 전환 시 실행)
    const livingMinion = this.state.players.find(
      (p) => p.isAlive && p.role?.team === 'minion',
    );
    if (!livingMinion) return false;

    this.pendingImpPromotion = { minionId: livingMinion.id };
    return true;
  }

  /** 밤→낮 전환 시 호출: 임프 자해 승계를 실행하고 승계된 플레이어를 반환 */
  flushImpPromotion(): Player | null {
    if (!this.pendingImpPromotion) return null;
    const { minionId } = this.pendingImpPromotion;
    this.pendingImpPromotion = null;

    const minion = this.state.players.find((p) => p.id === minionId);
    if (!minion || !minion.isAlive) return null;

    const impRole = getRoleById('imp');
    if (impRole) {
      minion.role = impRole;
    }
    return minion;
  }

  closeVote(): {
    nomineeId: string;
    nomineeName: string;
    guilty: boolean;
    votes: Record<string, boolean>;
    executionCandidate: {
      playerId: string;
      playerName: string;
      guiltyVotes: number;
    } | null;
    executionStatus: ExecutionStatus;
    executionMessage: string;
  } | null {
    const current = this.state.nominations[this.state.nominations.length - 1];
    if (!current) return null;

    // 집사 최종 검증: 주인이 최종적으로 투표하지 않았으면 집사 투표 제거
    for (const [butlerId, masterId] of this.butlerMasters) {
      if (!(butlerId in current.votes)) continue;
      const butler = this.getPlayer(butlerId);
      if (!butler || butler.role?.id !== 'butler' || isPoisonedOrDrunk(butler))
        continue;
      if (!(masterId in current.votes)) {
        delete current.votes[butlerId];
      }
    }

    const alivePlayers = this.state.players.filter((p) => p.isAlive).length;

    // 도둑/관료 투표 가중치 계산
    const voteMultipliers = this.getVoteMultipliers();
    let guiltyVotes = 0;
    for (const voterId of Object.keys(current.votes)) {
      guiltyVotes += voteMultipliers.get(voterId) ?? 1;
    }
    const reachedMajority = guiltyVotes >= Math.ceil(alivePlayers / 2);

    const nominee = this.getPlayer(current.nomineeId);
    const nomineeName = nominee?.name ?? current.nomineeId;
    const prevCandidate = this.executionCandidate;

    let guilty = false;
    let executionStatus: ExecutionStatus = 'no_change';
    let executionMessage = '';

    if (reachedMajority) {
      // 과반수를 넘겼고, 이전 최다 투표(또는 동률 threshold)보다 많으면 처형 대상 교체
      const threshold = this.executionCandidate
        ? this.executionCandidate.guiltyVotes
        : this.executionCandidateThreshold;

      if (guiltyVotes > threshold) {
        const isChange = prevCandidate !== null;
        this.executionCandidate = {
          playerId: current.nomineeId,
          guiltyVotes,
        };
        this.executionCandidateThreshold = 0;
        guilty = true;
        executionStatus = isChange ? 'candidate_changed' : 'new_candidate';
        executionMessage = isChange
          ? `${nomineeName}이(가) 더 많은 표를 받아 새 처형 대상이 되었습니다`
          : `${nomineeName}이(가) 처형 대상이 되었습니다`;
      }
      // 동률이면 처형 없음 (기존 후보 제거)
      if (
        this.executionCandidate &&
        guiltyVotes === this.executionCandidate.guiltyVotes &&
        this.executionCandidate.playerId !== current.nomineeId
      ) {
        const prevName =
          this.getPlayer(this.executionCandidate.playerId)?.name ??
          this.executionCandidate.playerId;
        this.executionCandidateThreshold = this.executionCandidate.guiltyVotes;
        this.executionCandidate = null;
        guilty = false;
        executionStatus = 'candidate_cleared';
        executionMessage = `${nomineeName}과(와) ${prevName}이(가) 동률이므로 처형 대상이 없습니다`;
      }
    }

    if (executionStatus === 'no_change') {
      executionMessage = this.executionCandidate
        ? `기존 처형 예정자 유지: ${this.getPlayer(this.executionCandidate.playerId)?.name ?? this.executionCandidate.playerId}`
        : '아무도 처형되지 않았습니다';
    }

    this.clearVoteTimer();

    // 총잡이: 오늘 첫 투표 찬성자 기록 (처음 집계되는 경우에만)
    if (this.todayFirstVoteGuiltyVoters === null) {
      this.todayFirstVoteGuiltyVoters = Object.keys(current.votes);
    }

    const candidateInfo = this.executionCandidate
      ? {
          playerId: this.executionCandidate.playerId,
          playerName:
            this.getPlayer(this.executionCandidate.playerId)?.name ??
            this.executionCandidate.playerId,
          guiltyVotes: this.executionCandidate.guiltyVotes,
        }
      : null;

    return {
      nomineeId: current.nomineeId,
      nomineeName: nomineeName,
      guilty,
      votes: current.votes,
      executionCandidate: candidateInfo,
      executionStatus,
      executionMessage,
    };
  }

  getExecutionCandidate(): { playerId: string; guiltyVotes: number } | null {
    return this.executionCandidate;
  }

  // ── 게임 설정 ──

  getSettings(): GameSettings {
    return this.state.settings;
  }

  setSettings(partial: Partial<GameSettings>): void {
    this.state.settings = { ...this.state.settings, ...partial };
  }

  // ── 플레이어 순서 (시계방향) ──

  getPlayerOrder(): string[] {
    return this.state.playerOrder;
  }

  setPlayerOrder(order: string[]): void {
    this.state.playerOrder = order;
  }

  /**
   * 시계방향 투표 순서 반환: 지명된 플레이어부터 시계방향으로 순서대로.
   * 지목당한 플레이어 본인도 투표에 포함됨.
   */
  getClockwiseVoteOrder(nomineeId: string): string[] {
    const order = this.state.playerOrder;
    if (order.length === 0) return [];

    const nomineeIndex = order.indexOf(nomineeId);
    if (nomineeIndex === -1) return [];

    const result: string[] = [];
    for (let i = 0; i < order.length; i++) {
      const idx = (nomineeIndex + i) % order.length;
      const playerId = order[idx];
      const player = this.getPlayer(playerId);
      // 사망 플레이어도 원래 자리 순서대로 투표 (deadVoteUsed면 제외)
      if (player && (isPubliclyAlive(player) || !player.deadVoteUsed)) {
        result.push(playerId);
      }
    }
    return result;
  }

  // ── 시계방향 투표 타이머 관리 ──

  clearVoteTimer(): void {
    if (this.voteCountdownTimeout) {
      clearTimeout(this.voteCountdownTimeout);
      this.voteCountdownTimeout = null;
    }
    if (this.voteClockInterval) {
      clearInterval(this.voteClockInterval);
      this.voteClockInterval = null;
    }
    this.votePreselections.clear();
  }

  setVoteCountdownTimeout(timeout: ReturnType<typeof setTimeout>): void {
    this.voteCountdownTimeout = timeout;
  }

  setVoteClockInterval(interval: ReturnType<typeof setInterval>): void {
    this.voteClockInterval = interval;
  }

  preselectVote(playerId: string, guilty: boolean | null): void {
    if (guilty === null) {
      this.votePreselections.delete(playerId);
      return;
    }
    this.votePreselections.set(playerId, guilty);
  }

  getPreselectedVote(playerId: string): boolean {
    return this.votePreselections.get(playerId) ?? false;
  }

  clearPreselections(): void {
    this.votePreselections.clear();
  }

  // ── 초공감자(Empath) 이웃 계산 ──

  /**
   * 초공감자의 살아있는 양쪽 이웃을 찾고 악한 이웃 수를 계산합니다.
   * playerOrder 기준으로 양 방향 가장 가까운 살아있는 플레이어를 반환합니다.
   */
  getEmpathNeighborInfo(empathPlayerId: string): {
    neighbors: { id: string; name: string; isEvil: boolean }[];
    evilCount: number;
  } {
    const order = this.state.playerOrder;
    const empathIndex = order.indexOf(empathPlayerId);
    if (empathIndex === -1) return { neighbors: [], evilCount: 0 };

    const neighbors: { id: string; name: string; isEvil: boolean }[] = [];

    // 시계방향 (오른쪽) 탐색
    for (let i = 1; i < order.length; i++) {
      const idx = (empathIndex + i) % order.length;
      const player = this.getPlayer(order[idx]);
      if (player?.isAlive) {
        neighbors.push({
          id: player.id,
          name: player.name,
          isEvil: isDetectedAsEvil(player),
        });
        break;
      }
    }

    // 반시계방향 (왼쪽) 탐색
    for (let i = 1; i < order.length; i++) {
      const idx = (empathIndex - i + order.length) % order.length;
      const player = this.getPlayer(order[idx]);
      if (player?.isAlive) {
        // 같은 플레이어가 양쪽 이웃일 수 있음 (2명만 살아있는 경우)
        if (neighbors.length > 0 && neighbors[0].id === player.id) break;
        neighbors.push({
          id: player.id,
          name: player.name,
          isEvil: isDetectedAsEvil(player),
        });
        break;
      }
    }

    const evilCount = neighbors.filter((n) => n.isEvil).length;
    return { neighbors, evilCount };
  }

  // ── 처단자 선언 확인 (투표 중 일시정지) ──

  pauseVoteClockForSlayer(nomineeId: string): void {
    if (this.voteClockInterval) {
      clearInterval(this.voteClockInterval);
      this.voteClockInterval = null;
    }
    this.voteClockPausedNomineeId = nomineeId;
    this.slayerAcks.clear();
  }

  addSlayerAck(playerId: string): void {
    this.slayerAcks.add(playerId);
  }

  isAllSlayerAcked(): boolean {
    const alivePlayers = this.state.players.filter((p) => p.isAlive);
    return alivePlayers.every((p) => this.slayerAcks.has(p.id));
  }

  getVoteClockPausedNomineeId(): string | null {
    return this.voteClockPausedNomineeId;
  }

  clearSlayerAckState(): void {
    this.voteClockPausedNomineeId = null;
    this.slayerAcks.clear();
  }

  // ── 변론 중 투표 동의 ──

  setVoteConsent(playerId: string, ready: boolean): void {
    if (ready) {
      this.voteConsentReady.add(playerId);
    } else {
      this.voteConsentReady.delete(playerId);
    }
  }

  getVoteConsentReadyIds(): string[] {
    return [...this.voteConsentReady];
  }

  clearVoteConsent(): void {
    this.voteConsentReady.clear();
  }

  // ── 지목 타이머 관리 ──

  startNominationTimer(durationMs: number): void {
    this.nominationRemainingMs = durationMs;
    this.nominationStartedAt = Date.now();
  }

  pauseNominationTimer(): void {
    if (
      this.nominationStartedAt === null ||
      this.nominationRemainingMs === null
    )
      return;
    const elapsed = Date.now() - this.nominationStartedAt;
    this.nominationRemainingMs = Math.max(
      0,
      this.nominationRemainingMs - elapsed,
    );
    this.nominationStartedAt = null;
  }

  resumeNominationTimer(): number | null {
    if (this.nominationRemainingMs === null || this.nominationRemainingMs <= 0)
      return null;
    this.nominationStartedAt = Date.now();
    return this.nominationRemainingMs;
  }

  clearNominationTimer(): void {
    this.nominationRemainingMs = null;
    this.nominationStartedAt = null;
  }

  getNominationRemainingMs(): number | null {
    return this.nominationRemainingMs;
  }

  // ── Sects & Violets 전용 메서드 ──

  endGame(): void {
    this.state.phase = 'ended';
  }

  setEditionId(editionId: string): void {
    this.editionId = editionId;
  }

  getEditionId(): string {
    return this.editionId;
  }

  /** 현재 게임의 에디션을 자동 감지하여 설정합니다 */
  detectEdition(): void {
    const svRoleIds = new Set(SECTS_AND_VIOLETS_ROLES.map((r) => r.id));
    const hasSvRole = this.state.players.some(
      (p) => p.role && svRoleIds.has(p.role.id),
    );
    this.editionId = hasSvRole ? 'sects_and_violets' : 'trouble_brewing';
  }

  // ── 마녀 저주 ──

  setWitchCursedTarget(playerId: string | null): void {
    // 기존 저주 대상의 상태 제거
    if (this.witchCursedTarget) {
      const prev = this.getPlayer(this.witchCursedTarget);
      if (prev) {
        prev.statuses = prev.statuses.filter((s) => s !== 'witch_cursed');
      }
    }
    this.witchCursedTarget = playerId;
    if (playerId) {
      const target = this.getPlayer(playerId);
      if (target && !target.statuses.includes('witch_cursed')) {
        target.statuses.push('witch_cursed');
      }
    }
  }

  getWitchCursedTarget(): string | null {
    return this.witchCursedTarget;
  }

  /** 밤 시작 시 마녀 저주 상태 초기화 */
  clearWitchCurse(): void {
    if (this.witchCursedTarget) {
      const prev = this.getPlayer(this.witchCursedTarget);
      if (prev) {
        prev.statuses = prev.statuses.filter((s) => s !== 'witch_cursed');
      }
    }
    this.witchCursedTarget = null;
  }

  /**
   * 마녀 저주 확인: 지명자가 저주 대상이면 true.
   * 마녀가 중독/취함이면 저주 무효.
   * 생존자 3명 이하일 때도 저주 무효.
   */
  checkWitchCurse(nominatorId: string): boolean {
    if (this.witchCursedTarget !== nominatorId) return false;

    // 생존자 3명 이하면 저주 무효
    const aliveCount = this.state.players.filter((p) => p.isAlive).length;
    if (aliveCount <= 3) return false;

    // 마녀가 중독/취함이면 저주 무효
    const witch = this.state.players.find(
      (p) => p.isAlive && p.role?.id === 'witch',
    );
    if (!witch) return false;
    if (isPoisonedOrDrunk(witch)) return false;

    return true;
  }

  // ── 사악한 쌍둥이 ──

  setEvilTwinPair(evilTwinId: string, goodTwinId: string): void {
    this.evilTwinPairs.set(evilTwinId, goodTwinId);
    const evilTwin = this.getPlayer(evilTwinId);
    if (evilTwin && !evilTwin.statuses.includes('evil_twin')) {
      evilTwin.statuses.push('evil_twin');
    }
    const goodTwin = this.getPlayer(goodTwinId);
    if (goodTwin && !goodTwin.statuses.includes('good_twin')) {
      goodTwin.statuses.push('good_twin');
    }
  }

  getGoodTwinId(evilTwinId: string): string | undefined {
    return this.evilTwinPairs.get(evilTwinId);
  }

  /** 선한 쌍둥이가 처형되었는지 확인 (악 팀 승리 조건) */
  isGoodTwinExecution(executedPlayerId: string): boolean {
    for (const [evilTwinId, goodTwinId] of this.evilTwinPairs) {
      if (goodTwinId !== executedPlayerId) continue;
      const evilTwin = this.getPlayer(evilTwinId);
      if (!evilTwin?.isAlive) continue;
      if (isPoisonedOrDrunk(evilTwin)) continue;
      return true;
    }
    return false;
  }

  // ── 팡 구 ──

  isFangGuJumped(): boolean {
    return this.fangGuJumped;
  }

  setFangGuJumped(): void {
    this.fangGuJumped = true;
  }

  /**
   * 팡 구 외지인 교환: 외지인이 새 악마가 되고 기존 팡 구는 사망.
   * 교환 성공 시 { oldDemon, newDemon } 반환, 아니면 null.
   */
  handleFangGuJump(
    oldDemonId: string,
    targetId: string,
  ): { oldDemon: Player; newDemon: Player } | null {
    if (this.fangGuJumped) return null;
    const target = this.getPlayer(targetId);
    if (!target) return null;
    if (target.role?.team !== 'outsider') return null;
    if (!target.isAlive) return null;

    const oldDemon = this.getPlayer(oldDemonId);
    if (!oldDemon) return null;
    if (
      !oldDemon.isAlive ||
      oldDemon.role?.id !== 'fang_gu' ||
      isPoisonedOrDrunk(oldDemon)
    )
      return null;

    this.fangGuJumped = true;

    // 외지인이 새 팡 구 악마가 됨 (악 진영으로 전환)
    const fangGuRole = getRoleById('fang_gu');
    if (fangGuRole) {
      target.role = fangGuRole;
    }
    target.alignment = 'evil';

    // 기존 팡 구는 사망
    oldDemon.isAlive = false;
    this.syncContinuousPoisoning();

    return { oldDemon, newDemon: target };
  }

  // ── 마귀할멈: 역할 변경 ──

  changePlayerRole(
    playerId: string,
    newRoleId: string,
    pitHagId?: string,
  ): boolean {
    if (pitHagId) {
      const pitHag = this.getPlayer(pitHagId);
      if (
        !pitHag?.isAlive ||
        pitHag.role?.id !== 'pit_hag' ||
        isPoisonedOrDrunk(pitHag)
      )
        return false;
    }

    const player = this.getPlayer(playerId);
    if (!player) return false;

    const newRole = getRoleById(newRoleId);
    if (!newRole) return false;

    // 같은 역할이 이미 있는지 확인
    const existing = this.state.players.find(
      (p) => p.id !== playerId && p.role?.id === newRoleId,
    );
    if (existing) return false; // 중복 역할은 이야기꾼이 처리

    player.role = newRole;
    // 주정뱅이 상태 제거 (역할 변경 시)
    player.drunkAs = undefined;
    player.statuses = player.statuses.filter((s) => s !== 'drunk');
    this.syncContinuousPoisoning();

    return true;
  }

  handleSnakeCharmerSwap(
    snakeCharmerId: string,
    demonId: string,
  ): { oldSnakeCharmer: Player; oldDemon: Player } | null {
    const oldSnakeCharmer = this.getPlayer(snakeCharmerId);
    const oldDemon = this.getPlayer(demonId);
    if (!oldSnakeCharmer || !oldDemon) return null;
    if (!oldSnakeCharmer.role || !oldDemon.role) return null;
    if (
      !oldSnakeCharmer.isAlive ||
      oldSnakeCharmer.role.id !== 'snake_charmer' ||
      isPoisonedOrDrunk(oldSnakeCharmer)
    )
      return null;
    if (oldDemon.role.team !== 'demon') return null;

    const snakeRole = oldSnakeCharmer.role;
    const demonRole = oldDemon.role;
    const snakeAlignment = this.getEffectiveAlignment(oldSnakeCharmer);
    const demonAlignment = this.getEffectiveAlignment(oldDemon);

    oldSnakeCharmer.role = demonRole;
    oldDemon.role = snakeRole;
    oldSnakeCharmer.alignment = demonAlignment ?? 'evil';
    oldDemon.alignment = snakeAlignment ?? 'good';

    if (!oldDemon.statuses.includes('poisoned')) {
      oldDemon.statuses.push('poisoned');
    }
    this.syncContinuousPoisoning();

    return { oldSnakeCharmer, oldDemon };
  }

  // ── 비고르모르티스: 죽인 하수인 능력 유지 + 이웃 중독 ──

  getVigormortisTownsfolkNeighborIds(minionId: string): string[] {
    return this.getTownsfolkNeighborIds(minionId);
  }

  handleVigormortisMinionKill(
    vigormortisId: string,
    minionId: string,
    poisonedNeighborId: string,
  ): { minion: Player; poisonedNeighbor: Player } | null {
    const vigormortis = this.getPlayer(vigormortisId);
    const minion = this.getPlayer(minionId);
    const poisonedNeighbor = this.getPlayer(poisonedNeighborId);
    if (!vigormortis || !minion || !poisonedNeighbor) return null;
    if (
      !vigormortis.isAlive ||
      vigormortis.role?.id !== 'vigormortis' ||
      isPoisonedOrDrunk(vigormortis)
    ) {
      return null;
    }
    if (minion.role?.team !== 'minion') return null;
    if (poisonedNeighbor.role?.team !== 'townsfolk') return null;
    if (
      !this.getVigormortisTownsfolkNeighborIds(minionId).includes(
        poisonedNeighborId,
      )
    ) {
      return null;
    }

    minion.isAlive = false;
    this.vigormortisRetainedMinions.add(minionId);
    this.vigormortisPoisonTargets.set(minionId, poisonedNeighborId);
    this.addStatus(minion, 'vigormortis_retained');
    this.addStatus(poisonedNeighbor, 'vigormortis_poisoned');
    this.syncContinuousPoisoning();

    return { minion, poisonedNeighbor };
  }

  // ── 이발사: 역할 교환 ──

  swapPlayerRoles(playerId1: string, playerId2: string): boolean {
    const p1 = this.getPlayer(playerId1);
    const p2 = this.getPlayer(playerId2);
    if (!p1 || !p2) return false;

    const role1 = p1.role;
    const role2 = p2.role;
    p1.role = role2;
    p2.role = role1;

    // drunkAs 교환
    const drunkAs1 = p1.drunkAs;
    p1.drunkAs = p2.drunkAs;
    p2.drunkAs = drunkAs1;

    // 점쟁이 Red Herring 재배정: 교환된 플레이어 중 점쟁이가 있으면
    if (p1.role?.id === 'fortune_teller' || p2.role?.id === 'fortune_teller') {
      this.assignFortuneTellerRedHerring();
    }

    // 집사 주인 매핑 갱신: 교환된 플레이어 중 집사가 있으면
    if (role1?.id === 'butler' && role2?.id !== 'butler') {
      const masterId = this.butlerMasters.get(playerId1);
      this.butlerMasters.delete(playerId1);
      if (masterId) {
        const stillMaster = [...this.butlerMasters.values()].includes(masterId);
        if (!stillMaster) {
          const master = this.getPlayer(masterId);
          if (master) {
            master.statuses = master.statuses.filter((s) => s !== 'master');
          }
        }
      }
    }
    if (role2?.id === 'butler' && role1?.id !== 'butler') {
      const masterId = this.butlerMasters.get(playerId2);
      this.butlerMasters.delete(playerId2);
      if (masterId) {
        const stillMaster = [...this.butlerMasters.values()].includes(masterId);
        if (!stillMaster) {
          const master = this.getPlayer(masterId);
          if (master) {
            master.statuses = master.statuses.filter((s) => s !== 'master');
          }
        }
      }
    }

    return true;
  }

  // ── 노 다시: 인접 마을주민 중독 계산 ──

  /**
   * 노 다시의 양쪽 가장 가까운 마을주민 이웃을 찾습니다.
   * playerOrder 기준으로 탐색합니다.
   */
  getNoDashiiPoisonedNeighbors(noDashiiPlayerId: string): string[] {
    return this.getTownsfolkNeighborIds(noDashiiPlayerId);
  }

  // ── 시계공: 악마와 가장 가까운 하수인 사이의 거리 ──

  getClockmakerDistance(): number {
    const order = this.state.playerOrder;
    const demons = this.state.players.filter(
      (p) => p.isAlive && p.role?.team === 'demon',
    );
    const minions = this.state.players.filter(
      (p) => p.isAlive && p.role?.team === 'minion',
    );

    if (demons.length === 0 || minions.length === 0) return 0;

    let minDist = order.length;
    for (const demon of demons) {
      const demonIdx = order.indexOf(demon.id);
      if (demonIdx === -1) continue;
      for (const minion of minions) {
        const minionIdx = order.indexOf(minion.id);
        if (minionIdx === -1) continue;
        const cw = (minionIdx - demonIdx + order.length) % order.length;
        const ccw = (demonIdx - minionIdx + order.length) % order.length;
        const dist = Math.min(cw, ccw);
        if (dist < minDist) minDist = dist;
      }
    }
    return minDist;
  }

  // ── Vortox: 처형 없는 날 확인 ──

  /** Vortox 확인: 보르톡스가 게임에 있는지 */
  hasVortox(): boolean {
    return this.state.players.some(
      (p) => p.isAlive && p.role?.id === 'vortox' && !isPoisonedOrDrunk(p),
    );
  }

  /** 보르톡스 게임에서 낮이 처형 없이 끝났을 때 악 팀 승리 결과를 생성합니다. */
  checkVortoxNoExecutionWin(): GameResult | null {
    if (!this.state.started || this.state.phase === 'ended') return null;
    if (!this.hasVortox() || this.executionToday) return null;

    this.state.phase = 'ended';
    return {
      winningTeam: 'evil',
      reason: '보르톡스 게임에서 처형 없이 낮이 끝났습니다',
      cause: 'vortox_no_execution',
      players: this.state.players.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role ?? {
          id: 'unknown',
          name: '???',
          team: 'townsfolk',
          ability: '',
          edition: '',
        },
        isAlive: p.isAlive,
        team: p.role?.team ?? 'townsfolk',
      })),
    };
  }

  /**
   * 승리 조건에 S&V 추가 확인:
   * - 사악한 쌍둥이의 선한 쌍둥이 처형 → 악 팀 승리
   * - 보르톡스: 처형 없는 날 → 악 팀 승리
   * - 악마 사망 시 사악한 쌍둥이가 둘 다 살아있으면 게임 계속
   */
  checkWinCondition(
    executedRoleId?: string,
    executedPlayerId?: string,
  ): GameResult | null {
    if (!this.state.started || this.state.phase === 'ended') return null;

    const alivePlayers = this.state.players.filter((p) => p.isAlive);
    // 여행자는 생존자 수 계산에서 제외 (승리 조건 판정용)
    const aliveRegularPlayers = alivePlayers.filter((p) => !p.isTraveller);
    const aliveCount = aliveRegularPlayers.length;

    const buildResult = (
      winningTeam: 'good' | 'evil',
      reason: string,
    ): GameResult => {
      this.state.phase = 'ended';
      return {
        winningTeam,
        reason,
        players: this.state.players.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role ?? {
            id: 'unknown',
            name: '???',
            team: 'townsfolk',
            ability: '',
            edition: '',
          },
          isAlive: p.isAlive,
          team: p.role?.team ?? 'townsfolk',
        })),
      };
    };

    // 성자(Saint) 처형 → 악한 팀 승리 (중독/취한 성자는 능력 무효화)
    if (executedRoleId === 'saint') {
      const saintPlayer = this.state.players.find(
        (p) => p.role?.id === 'saint',
      );
      if (saintPlayer && !isPoisonedOrDrunk(saintPlayer)) {
        return buildResult('evil', '성자가 처형되었습니다');
      }
    }

    // S&V: 사악한 쌍둥이 - 선한 쌍둥이 처형 → 악 팀 승리
    if (executedPlayerId && this.isGoodTwinExecution(executedPlayerId)) {
      return buildResult('evil', '선한 쌍둥이가 처형되었습니다');
    }

    // 악한 악마 사망 체크. 뱀 조련사/마귀할멈으로 역할과 진영이 달라질 수 있습니다.
    const aliveDemon = alivePlayers.find(
      (p) =>
        p.role?.team === 'demon' && this.getEffectiveAlignment(p) === 'evil',
    );
    if (!aliveDemon) {
      // 임프 자해 승계가 예약되어 있으면 게임 계속
      if (this.pendingImpPromotion) {
        return null;
      }

      // 사악한 쌍둥이: 둘 다 살아있으면 게임 계속 (악마 사망해도)
      for (const [evilTwinId, goodTwinId] of this.evilTwinPairs) {
        const evilTwin = this.getPlayer(evilTwinId);
        const goodTwin = this.getPlayer(goodTwinId);
        if (evilTwin?.isAlive && goodTwin?.isAlive) {
          if (!isPoisonedOrDrunk(evilTwin)) {
            return null; // 게임 계속
          }
        }
      }

      // 탕녀 승계: 생존자 5명 이상이고 살아있는 (중독되지 않은) 탕녀가 있으면 게임 계속
      const aliveScarletWoman = alivePlayers.find(
        (p) => p.role?.id === 'scarlet_woman' && !hasPoisonStatus(p.statuses),
      );
      if (aliveScarletWoman && aliveCount >= 5) {
        // 탕녀를 임프로 자동 승계
        const impRole = getRoleById('imp');
        if (impRole) {
          aliveScarletWoman.role = impRole;
          this.lastPromotedPlayer = aliveScarletWoman;
        }
        return null;
      }
      return buildResult('good', '악마가 사망했습니다');
    }

    // 생존자 2명 이하 → 악한 팀 승리
    if (aliveCount <= 2) {
      return buildResult('evil', '악마가 마을을 장악했습니다');
    }

    // 시장(Mayor): 생존자 3명 + 오늘 처형 없음 + 살아있는 (중독되지 않은) 시장
    if (aliveCount === 3 && !this.executionToday) {
      const aliveMayor = alivePlayers.find(
        (p) => p.role?.id === 'mayor' && !isPoisonedOrDrunk(p),
      );
      if (aliveMayor) {
        return buildResult('good', '시장이 마을을 이끌었습니다');
      }
    }

    return null;
  }
}
