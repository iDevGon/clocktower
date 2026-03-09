import { randomUUID } from 'node:crypto';
import type {
  DaySubPhase,
  GameResult,
  GameState,
  Nomination,
  Phase,
  Player,
  PlayerStatus,
  Role,
} from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';

/** 플레이어가 중독 또는 취함 상태인지 확인 (능력 무효화 판정용) */
function isPoisonedOrDrunk(player: Player): boolean {
  return player.statuses.includes('poisoned') || player.statuses.includes('drunk');
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
  };

  // 집사의 주인 추적 (butlerPlayerId → masterPlayerId)
  private butlerMasters = new Map<string, string>();
  // 밤 행동 타깃 추적 (playerId → targetIds) — 임프 자해 감지용
  private nightActionTargets = new Map<string, string[]>();
  // 사냥꾼 능력 사용 추적
  private slayerUsed = new Set<string>();
  // 성녀 능력 발동 여부
  private virginTriggered = false;
  // 오늘 처형이 있었는지 (시장 승리 조건용)
  private executionToday = false;
  // 밤 중 사망한 플레이어 (낮 전환 시 알림용)
  private pendingNightKills: string[] = [];
  // 현재 활성 밤 역할 및 순서 (재접속 시 복원용)
  private currentNightRoleId: string | null = null;
  private currentNightOrder: string[] = [];

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
    };
    this.butlerMasters.clear();
    this.nightActionTargets.clear();
    this.slayerUsed.clear();
    this.virginTriggered = false;
    this.executionToday = false;
    this.pendingNightKills = [];
    this.currentNightRoleId = null;
    this.currentNightOrder = [];
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
    };
    this.butlerMasters.clear();
    this.nightActionTargets.clear();
    this.slayerUsed.clear();
    this.virginTriggered = false;
    this.executionToday = false;
    this.pendingNightKills = [];
    this.currentNightRoleId = null;
    this.currentNightOrder = [];
  }

  getState(): GameState {
    return { ...this.state };
  }

  getPlayer(playerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  addPlayer(name: string): Player | null {
    if (this.state.started) return null;

    const player: Player = {
      id: randomUUID().slice(0, 8),
      name,
      isAlive: true,
      hasNominatedToday: false,
      deadVoteUsed: false,
      statuses: [],
    };
    this.state.players.push(player);
    return player;
  }

  clearPlayers(): void {
    this.state.players = [];
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
      this.pendingNightKills = [];
      for (const p of this.state.players) {
        p.hasNominatedToday = false;
        // 밤 시작 시 중독/보호 상태 자동 제거
        p.statuses = p.statuses.filter(
          (s) => s !== 'poisoned' && s !== 'protected',
        );
      }
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
    };
    player.role = role;
    player.drunkAs = drunkAs;

    // 주정뱅이는 처음부터 '취함' 상태 자동 부여
    if (roleId === 'drunk' && !player.statuses.includes('drunk')) {
      player.statuses.push('drunk');
    } else if (roleId !== 'drunk') {
      player.statuses = player.statuses.filter((s) => s !== 'drunk');
    }
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
    return { activeRoleId: this.currentNightRoleId, order: this.currentNightOrder };
  }

  // ── 집사 주인 관리 ──

  setButlerMaster(butlerId: string, masterId: string): void {
    this.butlerMasters.set(butlerId, masterId);
  }

  getButlerMaster(butlerId: string): string | undefined {
    return this.butlerMasters.get(butlerId);
  }

  // ── 밤 행동 타깃 기록 (임프 자해 감지용) ──

  recordNightAction(playerId: string, targets: string[]): void {
    this.nightActionTargets.set(playerId, targets);
  }

  // ── 사냥꾼 능력 ──

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
    if (nominatorId === nomineeId)
      return { success: false, error: '자기 자신은 지목할 수 없습니다' };

    nominator.hasNominatedToday = true;

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

  castVote(
    playerId: string,
    guilty: boolean,
    bypassButlerCheck = false,
  ): { success: boolean; error?: string } {
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
    if (!bypassButlerCheck && player.role?.id === 'butler' && !isPoisonedOrDrunk(player)) {
      const masterId = this.butlerMasters.get(playerId);
      if (masterId) {
        const current =
          this.state.nominations[this.state.nominations.length - 1];
        if (current && !(masterId in current.votes)) {
          return {
            success: false,
            error: '주인이 아직 투표하지 않았습니다',
          };
        }
      }
    }

    const current = this.state.nominations[this.state.nominations.length - 1];
    if (current) {
      current.votes[playerId] = guilty;
    }
    return { success: true };
  }

  returnToNomination(): void {
    this.state.phase = 'day';
    this.state.daySubPhase = 'nomination';
  }

  // ── 임프 자해 → 하수인 승계 ──

  handleImpSelfKill(impPlayerId: string): Player | null {
    const targets = this.nightActionTargets.get(impPlayerId);
    if (!targets || !targets.includes(impPlayerId)) return null;

    // 살아있는 하수인 중 한 명을 임프로 승격
    const livingMinion = this.state.players.find(
      (p) => p.isAlive && p.role?.team === 'minion',
    );
    if (!livingMinion) return null;

    const impRole = getRoleById('imp');
    if (impRole) {
      livingMinion.role = impRole;
    }
    return livingMinion;
  }

  /**
   * 승리 조건 확인. 게임 종료 시 GameResult 반환, 아직 진행 중이면 null.
   * - 악마 사망 (붉은 여인 승계 조건 미충족) → 선한 팀 승리
   * - 생존자 2명 이하 (악마 포함) → 악한 팀 승리
   * - 성인 처형 → 악한 팀 승리 (호출 측에서 executedRoleId 전달)
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
          role: p.role ?? { id: 'unknown', name: '???', team: 'townsfolk', ability: '' },
          isAlive: p.isAlive,
          team: p.role?.team ?? 'townsfolk',
        })),
      };
    };

    // 성인(Saint) 처형 → 악한 팀 승리 (중독/취한 성인은 능력 무효화)
    if (executedRoleId === 'saint') {
      const saintPlayer = this.state.players.find(
        (p) => p.role?.id === 'saint',
      );
      if (saintPlayer && !isPoisonedOrDrunk(saintPlayer)) {
        return buildResult('evil', '성인이 처형되었습니다');
      }
    }

    // 악마 사망 체크
    const aliveDemon = alivePlayers.find((p) => p.role?.team === 'demon');
    if (!aliveDemon) {
      // 붉은 여인 승계: 생존자 5명 이상이고 살아있는 (중독되지 않은) 붉은 여인이 있으면 게임 계속
      const aliveScarletWoman = alivePlayers.find(
        (p) =>
          p.role?.id === 'scarlet_woman' && !p.statuses.includes('poisoned'),
      );
      if (aliveScarletWoman && aliveCount >= 5) {
        return null; // 붉은 여인이 악마가 됨 — 스토리텔러가 수동 처리
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
  } | null {
    const current = this.state.nominations[this.state.nominations.length - 1];
    if (!current) return null;

    const alivePlayers = this.state.players.filter((p) => p.isAlive).length;
    const guiltyVotes = Object.values(current.votes).filter(Boolean).length;
    const guilty = guiltyVotes >= Math.ceil(alivePlayers / 2);

    const nominee = this.getPlayer(current.nomineeId);

    return {
      nomineeId: current.nomineeId,
      nomineeName: nominee?.name ?? current.nomineeId,
      guilty,
      votes: current.votes,
    };
  }
}
