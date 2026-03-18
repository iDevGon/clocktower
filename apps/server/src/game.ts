import { randomUUID } from 'node:crypto';
import type {
  DaySubPhase,
  GameResult,
  GameSettings,
  GameState,
  Nomination,
  Phase,
  Player,
  PlayerStatus,
  Role,
} from '@clocktower/shared/logic';
import { DEFAULT_GAME_SETTINGS, getRoleById } from '@clocktower/shared/logic';

/** 플레이어가 중독 또는 취함 상태인지 확인 (능력 무효화 판정용) */
function isPoisonedOrDrunk(player: Player): boolean {
  return (
    player.statuses.includes('poisoned') || player.statuses.includes('drunk')
  );
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
    this.slayerAcks.clear();
    this.voteClockPausedNomineeId = null;
    this.virginTriggered = false;
    this.executionToday = false;
    this.pendingNightKills = [];
    this.currentNightRoleId = null;
    this.currentNightOrder = [];
    this.fortuneTellerRedHerring = null;
    this.clearVoteTimer();
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
    this.slayerAcks.clear();
    this.voteClockPausedNomineeId = null;
    this.virginTriggered = false;
    this.executionToday = false;
    this.executionCandidate = null;
    this.pendingNightKills = [];
    this.currentNightRoleId = null;
    this.currentNightOrder = [];
    this.fortuneTellerRedHerring = null;
    this.clearVoteTimer();
  }

  getState(): GameState {
    const butlerMasters: Record<string, string> = {};
    for (const [butlerId, masterId] of this.butlerMasters) {
      butlerMasters[butlerId] = masterId;
    }
    return {
      ...this.state,
      butlerMasters:
        Object.keys(butlerMasters).length > 0 ? butlerMasters : undefined,
    };
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
    this.state.players.splice(index, 1);
    this.state.playerOrder = this.state.playerOrder.filter(
      (id) => id !== playerId,
    );
    return true;
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
    if (this.state.players.length < 5)
      return { success: false, error: '최소 5명의 플레이어가 필요합니다' };
    if (!this.state.players.every((p) => p.role))
      return { success: false, error: '모든 플레이어에게 역할을 배정해주세요' };

    this.state.started = true;
    this.state.phase = 'night';
    this.state.day = 1;
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
      this.pendingNightKills = [];
      this.state.players.forEach((p) => {
        p.hasNominatedToday = false;
        p.hasBeenNominatedToday = false;
        // 밤 시작 시 중독/보호 상태 자동 제거
        p.statuses = p.statuses.filter(
          (s) => s !== 'poisoned' && s !== 'protected',
        );
      });
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
    player.drunkAs = undefined;
    player.statuses = player.statuses.filter((s) => s !== 'drunk');
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
    player.drunkAs = drunkAs;

    // 주정뱅이는 처음부터 '취함' 상태 자동 부여
    if (roleId === 'drunk') {
      if (!player.statuses.includes('drunk')) {
        player.statuses.push('drunk');
      }
      return;
    }
    player.statuses = player.statuses.filter((s) => s !== 'drunk');
  }

  kill(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (player) player.isAlive = false;
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

  revive(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (player) player.isAlive = true;
  }

  setPlayerStatuses(playerId: string, statuses: PlayerStatus[]): void {
    const player = this.getPlayer(playerId);
    if (player) player.statuses = statuses;
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
        p.id !== fortuneTeller.id &&
        (p.role?.team === 'townsfolk' || p.role?.team === 'outsider'),
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
   * 점쟁이가 중독/취함이면 결과를 반전합니다.
   */
  judgeFortuneTeller(targets: string[]): boolean {
    const fortuneTeller = this.state.players.find(
      (p) => p.role?.id === 'fortune_teller',
    );

    const hasDemonOrRedHerring = targets.some((targetId) => {
      const target = this.getPlayer(targetId);
      if (!target) return false;
      if (target.role?.team === 'demon') return true;
      if (targetId === this.fortuneTellerRedHerring) return true;
      return false;
    });

    // 중독/취함 상태면 결과 반전
    if (fortuneTeller && isPoisonedOrDrunk(fortuneTeller)) {
      return !hasDemonOrRedHerring;
    }

    return hasDemonOrRedHerring;
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

  // ── 처단자 능력 ──

  isSlayerUsed(playerId: string): boolean {
    return this.slayerUsed.has(playerId);
  }

  markSlayerUsed(playerId: string): void {
    this.slayerUsed.add(playerId);
  }

  // ── 처형 기록 (시장 승리 조건용) ──

  markExecution(): void {
    this.executionToday = true;
  }

  hadExecutionToday(): boolean {
    return this.executionToday;
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
    if (nominator.hasNominatedToday)
      return { success: false, error: '이미 오늘 지목을 사용했습니다' };
    if (nominee.hasBeenNominatedToday)
      return {
        success: false,
        error: '이미 오늘 지목을 당한 플레이어입니다',
      };
    if (nominatorId === nomineeId)
      return { success: false, error: '자기 자신은 지목할 수 없습니다' };
    if (this.executionToday)
      return { success: false, error: '오늘 이미 처형이 있었습니다' };

    nominator.hasNominatedToday = true;
    nominee.hasBeenNominatedToday = true;

    // 성녀(Virgin) 트리거: 처음 지명당했을 때, 지명자가 마을주민이면 즉시 처형
    // 중독/취한 성녀는 능력이 무효화됨
    let virginKill: string | undefined;
    if (
      !this.virginTriggered &&
      nominee.role?.id === 'virgin' &&
      nominee.isAlive &&
      !isPoisonedOrDrunk(nominee)
    ) {
      this.virginTriggered = true;
      if (nominator.role?.team === 'townsfolk') {
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

  castVote(playerId: string): { success: boolean; error?: string } {
    const player = this.getPlayer(playerId);
    if (!player)
      return { success: false, error: '플레이어를 찾을 수 없습니다' };

    if (!player.isAlive) {
      if (player.deadVoteUsed)
        return {
          success: false,
          error: '사망한 플레이어는 게임당 한 번만 투표할 수 있습니다',
        };
      player.deadVoteUsed = true;
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

  /**
   * 승리 조건 확인. 게임 종료 시 GameResult 반환, 아직 진행 중이면 null.
   * - 악마 사망 (탕녀 승계 조건 미충족) → 선한 팀 승리
   * - 생존자 2명 이하 (악마 포함) → 악한 팀 승리
   * - 성자 처형 → 악한 팀 승리 (호출 측에서 executedRoleId 전달)
   * - 시장: 생존자 3명, 오늘 처형 없음, 살아있는 시장 → 선한 팀 승리
   */
  checkWinCondition(executedRoleId?: string): GameResult | null {
    if (!this.state.started || this.state.phase === 'ended') return null;

    const alivePlayers = this.state.players.filter((p) => p.isAlive);
    const aliveCount = alivePlayers.length;

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

    // 악마 사망 체크
    const aliveDemon = alivePlayers.find((p) => p.role?.team === 'demon');
    if (!aliveDemon) {
      // 임프 자해 승계가 예약되어 있으면 게임 계속
      if (this.pendingImpPromotion) {
        return null;
      }
      // 탕녀 승계: 생존자 5명 이상이고 살아있는 (중독되지 않은) 탕녀가 있으면 게임 계속
      const aliveScarletWoman = alivePlayers.find(
        (p) =>
          p.role?.id === 'scarlet_woman' && !p.statuses.includes('poisoned'),
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
    const guiltyVotes = Object.keys(current.votes).length;
    const reachedMajority = guiltyVotes >= Math.ceil(alivePlayers / 2);

    // 과반수를 넘겼고, 이전 최다 투표보다 많으면 처형 대상 교체
    let guilty = false;
    if (reachedMajority) {
      if (
        !this.executionCandidate ||
        guiltyVotes > this.executionCandidate.guiltyVotes
      ) {
        this.executionCandidate = {
          playerId: current.nomineeId,
          guiltyVotes,
        };
        guilty = true;
      }
      // 동률이면 처형 없음 (기존 후보 유지하지 않음)
      if (
        this.executionCandidate &&
        guiltyVotes === this.executionCandidate.guiltyVotes &&
        this.executionCandidate.playerId !== current.nomineeId
      ) {
        this.executionCandidate = null;
        guilty = false;
      }
    }

    const nominee = this.getPlayer(current.nomineeId);

    this.clearVoteTimer();

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
      nomineeName: nominee?.name ?? current.nomineeId,
      guilty,
      votes: current.votes,
      executionCandidate: candidateInfo,
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
      if (player && (player.isAlive || !player.deadVoteUsed)) {
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
        const isEvil =
          player.role?.team === 'minion' || player.role?.team === 'demon';
        neighbors.push({ id: player.id, name: player.name, isEvil });
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
        const isEvil =
          player.role?.team === 'minion' || player.role?.team === 'demon';
        neighbors.push({ id: player.id, name: player.name, isEvil });
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
}
