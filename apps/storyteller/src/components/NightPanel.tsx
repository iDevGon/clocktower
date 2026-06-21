import type {
  NightAction,
  NightFeedbackPayload,
  Player,
  PlayerStatus,
} from '@clocktower/shared';
import {
  ALL_ROLES,
  getRoleById,
  NIGHT_ACTIONS,
  NIGHT_FEEDBACK,
} from '@clocktower/shared';
import { colors } from '@clocktower/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { createGrimoireStyles } from '../styles/grimoire.styles';
import { NightActionLog, NightFeedbackPanel } from './NightActionLog';
import { NightOrderPanel } from './NightOrderPanel';
import {
  formatNightRoleLabel,
  getNightRolePlayerNames,
} from './nightRoleDisplay';
import { isAbilityMalfunctioning, isDetectedAsEvil } from './nightRoleLogic';
import { SpyGrimoireComposer } from './SpyGrimoireComposer';

type BmrAssistResult = { success: boolean; error?: string };

interface NightPanelProps {
  day: number;
  players: Player[];
  nightActions: NightAction[];
  playerStatuses: Record<string, PlayerStatus[]>;
  activeNightRoleId: string | null;
  activeRoleIds: string[];
  dormantRoleIds: string[];
  skippedNightRoles: string[];
  executedPlayer: Player | null;
  empathNeighborIds: Set<string>;
  empathEvilCount: number;
  chefEvilPairCount: number;
  chefEvilPairNames: string[][];
  playerOrder: string[];
  onActivateRole: (roleId: string | null) => void;
  onNightComplete: () => void;
  onSendFeedback: (playerId: string, feedback: NightFeedbackPayload) => void;
  onKill: (playerId: string) => void;
  onRevive?: (playerId: string) => void;
  onSetStatus: (playerId: string, status: PlayerStatus) => void;
  onRemoveStatus?: (playerId: string, status: PlayerStatus) => void;
  onFangGuJump?: (oldDemonId: string, newDemonId: string) => void;
  onSnakeCharmerSwap?: (snakeCharmerId: string, demonId: string) => void;
  onVigormortisKillMinion?: (
    vigormortisId: string,
    minionId: string,
    poisonedNeighborId: string,
  ) => void;
  onPitHagChangeRole?: (
    pitHagId: string,
    targetPlayerId: string,
    newRoleId: string,
  ) => void;
  onBoneCollectorRestore?: (
    boneCollectorId: string,
    targetPlayerId: string,
  ) => void;
  onApplyBaristaEffect?: (
    targetPlayerId: string,
    effect: 'sober_healthy' | 'acts_twice',
  ) => void;
  onCourtierChooseRole?: (
    courtierId: string,
    roleId: string,
    callback?: (result: BmrAssistResult) => void,
  ) => void;
  onGamblerGuess?: (
    gamblerId: string,
    targetPlayerId: string,
    guessedRoleId: string,
    callback?: (result: BmrAssistResult) => void,
  ) => void;
  onGossipKill?: (
    gossipId: string,
    targetPlayerId: string,
    callback?: (result: BmrAssistResult) => void,
  ) => void;
  onMoonchildChoose?: (
    moonchildId: string,
    targetPlayerId: string,
    callback?: (result: BmrAssistResult) => void,
  ) => void;
  nightWakeUpTargets: string[];
  styles: ReturnType<typeof createGrimoireStyles>;
  /** 에디션 ID (밤 순서 결정에 사용) */
  editionId?: string;
  /** 곡예사 추측의 정답 수 (playerId → count) */
  jugglerCorrectCount?: Record<string, number>;
  /** 표준 night order에 없지만 추가로 활성화 가능한 역할 (예: 철학자가 부여받은 첫 밤 역할) */
  extraNightRoleIds?: string[];
  /** PC 단축키 등 외부 요청으로 밤 순서를 한 단계 진행할 때 증가시키는 값 */
  advanceRequestId?: number;
}

export function NightPanel({
  day,
  players,
  nightActions,
  playerStatuses,
  activeNightRoleId,
  activeRoleIds,
  dormantRoleIds,
  skippedNightRoles,
  executedPlayer,
  empathNeighborIds,
  empathEvilCount,
  chefEvilPairCount,
  chefEvilPairNames,
  playerOrder,
  onActivateRole,
  onNightComplete,
  onSendFeedback,
  onKill,
  onRevive,
  onSetStatus,
  onRemoveStatus,
  onFangGuJump,
  onSnakeCharmerSwap,
  onVigormortisKillMinion,
  onPitHagChangeRole,
  onBoneCollectorRestore,
  onApplyBaristaEffect,
  onCourtierChooseRole,
  onGamblerGuess,
  onGossipKill,
  onMoonchildChoose,
  nightWakeUpTargets,
  styles,
  editionId,
  jugglerCorrectCount,
  extraNightRoleIds,
  advanceRequestId,
}: NightPanelProps) {
  const [feedbackCollapsed, setFeedbackCollapsed] = useState(false);
  const [feedbackSentForRole, setFeedbackSentForRole] = useState<string | null>(
    null,
  );
  const [nightOrderComplete, setNightOrderComplete] = useState(false);
  const [nightElapsed, setNightElapsed] = useState(0);
  const [baristaTargetId, setBaristaTargetId] = useState<string | null>(null);
  const [courtierRoleId, setCourtierRoleId] = useState<string | null>(null);
  const [gamblerTargetId, setGamblerTargetId] = useState<string | null>(null);
  const [gamblerRoleId, setGamblerRoleId] = useState<string | null>(null);
  const [bmrAssistTargetId, setBmrAssistTargetId] = useState<string | null>(
    null,
  );
  const nightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track elapsed time per active night role
  useEffect(() => {
    if (nightTimerRef.current) clearInterval(nightTimerRef.current);
    setNightElapsed(0);
    if (activeNightRoleId) {
      nightTimerRef.current = setInterval(() => {
        setNightElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (nightTimerRef.current) clearInterval(nightTimerRef.current);
    };
  }, [activeNightRoleId]);

  // Auto-expand feedback and reset sent state when active role changes
  useEffect(() => {
    if (activeNightRoleId) {
      setFeedbackCollapsed(false);
      setFeedbackSentForRole(null);
      setBaristaTargetId(null);
      setCourtierRoleId(null);
      setGamblerTargetId(null);
      setGamblerRoleId(null);
      setBmrAssistTargetId(null);
    }
  }, [activeNightRoleId]);

  const isFeedbackSent = feedbackSentForRole === activeNightRoleId;

  // Check if current role has feedback to show
  const hasNightFeedback = useMemo(() => {
    if (!activeNightRoleId) return false;
    const fbDef = NIGHT_FEEDBACK[activeNightRoleId];
    if (!fbDef || fbDef.type === 'none' || fbDef.type === 'grimoire')
      return false;
    // 서버가 알려준 wakeUp 대상이 있으면 그것으로 판단
    if (nightWakeUpTargets.length > 0) return true;
    // fallback
    const isOnlyWhenDead =
      NIGHT_ACTIONS[activeNightRoleId]?.onlyWhenDead === true;
    return players.some(
      (p) =>
        (p.role?.id === activeNightRoleId ||
          (p.role?.id === 'drunk' && p.drunkAs === activeNightRoleId)) &&
        (isOnlyWhenDead
          ? !p.isAlive
          : p.isAlive ||
            p.statuses.includes('zombuul_registers_dead') ||
            p.statuses.includes('vigormortis_retained')),
    );
  }, [activeNightRoleId, players, nightWakeUpTargets]);

  // Expose nightOrderComplete to parent
  useEffect(() => {
    if (nightOrderComplete) {
      onNightComplete();
    }
  }, [nightOrderComplete, onNightComplete]);

  const baristaCandidates = useMemo(
    () => players.filter((p) => p.isAlive),
    [players],
  );
  const selectedBaristaTarget = baristaTargetId
    ? players.find((p) => p.id === baristaTargetId)
    : null;
  const activeRolePlayer = activeNightRoleId
    ? players.find(
        (p) =>
          p.role?.id === activeNightRoleId ||
          (p.role?.id === 'drunk' && p.drunkAs === activeNightRoleId),
      )
    : undefined;
  const livingPlayers = useMemo(
    () =>
      players.filter(
        (p) => p.isAlive || p.statuses.includes('zombuul_registers_dead'),
      ),
    [players],
  );
  const activeNightRolePlayerNames = activeNightRoleId
    ? getNightRolePlayerNames(players, activeNightRoleId)
    : [];
  const spyPlayer =
    activeNightRoleId === 'spy'
      ? players.find((p) => p.isAlive && p.role?.id === 'spy')
      : undefined;
  const hasSpyManualFeedback =
    activeNightRoleId === 'spy' &&
    spyPlayer != null &&
    isAbilityMalfunctioning(spyPlayer);
  const shouldShowFloatingTimer = hasNightFeedback || hasSpyManualFeedback;

  const handleBaristaApply = (effect: 'sober_healthy' | 'acts_twice') => {
    if (!baristaTargetId) return;
    onApplyBaristaEffect?.(baristaTargetId, effect);
    setFeedbackSentForRole(activeNightRoleId);
  };

  const handleBmrAssistResult = (result: BmrAssistResult) => {
    if (!result.success) return;
    setFeedbackSentForRole(activeNightRoleId);
  };

  const bmrAssistPanelRoleIds = new Set([
    'courtier',
    'gambler',
    'gossip',
    'moonchild',
  ]);
  const showBmrAssistPanel =
    activeNightRoleId != null &&
    bmrAssistPanelRoleIds.has(activeNightRoleId) &&
    activeRolePlayer != null &&
    !isFeedbackSent;

  const renderChip = (
    id: string,
    label: string,
    selected: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={id}
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: selected ? colors.arcane.border.brass : '#3a3a42',
        backgroundColor: selected ? colors.arcane.surface.parchment : '#202026',
        paddingHorizontal: 10,
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          color: selected ? colors.arcane.text.label : '#c8c2b8',
          fontWeight: selected ? '700' : '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View>
      {nightActions.length > 0 && (
        <NightActionLog
          actions={nightActions}
          players={players}
          playerStatuses={playerStatuses}
          onSendFeedback={onSendFeedback}
          onKill={onKill}
          onRevive={onRevive}
          onSetStatus={onSetStatus}
          onRemoveStatus={onRemoveStatus}
          playerOrder={playerOrder}
          onFangGuJump={onFangGuJump}
          onSnakeCharmerSwap={onSnakeCharmerSwap}
          onVigormortisKillMinion={onVigormortisKillMinion}
          onPitHagChangeRole={onPitHagChangeRole}
          onBoneCollectorRestore={onBoneCollectorRestore}
        />
      )}
      <View>
        {/* Floating timer - always visible above overlay */}
        {shouldShowFloatingTimer &&
          activeNightRoleId &&
          (() => {
            const role = getRoleById(activeNightRoleId);
            const roleLabel = formatNightRoleLabel(
              role?.name ?? activeNightRoleId,
              activeNightRolePlayerNames,
            );
            const m = Math.floor(nightElapsed / 60);
            const sec = nightElapsed % 60;
            return (
              <View style={styles.nightFloatingTimer}>
                <Text style={styles.nightFloatingTimerRole}>{roleLabel}</Text>
                <Text style={styles.nightFloatingTimerTime}>
                  {m}:{sec.toString().padStart(2, '0')}
                </Text>
                {isFeedbackSent ? (
                  <View style={styles.nightFeedbackSentBadge}>
                    <Text style={styles.nightFeedbackSentText}>
                      피드백 전송됨
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setFeedbackCollapsed((prev) => !prev)}
                    style={styles.nightFeedbackToggle}
                  >
                    <Text style={styles.nightFeedbackToggleText}>
                      {feedbackCollapsed ? '피드백 ▲' : '피드백 ▼'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })()}

        {/* NightOrderPanel + NightFeedbackPanel overlay container */}
        <View style={styles.nightOrderRelative}>
          <NightOrderPanel
            day={day}
            players={players}
            activeRoleIds={activeRoleIds}
            skippedRoleIds={skippedNightRoles}
            dormantRoleIds={dormantRoleIds}
            activeNightRoleId={activeNightRoleId}
            onActivateRole={onActivateRole}
            onNightComplete={() => {
              setNightOrderComplete(true);
            }}
            editionId={editionId}
            extraRoleIds={extraNightRoleIds}
            advanceRequestId={advanceRequestId}
          />

          {activeNightRoleId === 'barista' && !isFeedbackSent && (
            <View
              style={{
                marginTop: 12,
                borderWidth: 1,
                borderColor: '#3a3a42',
                backgroundColor: '#17171b',
                padding: 12,
                gap: 10,
              }}
            >
              <Text style={{ color: '#e0ddd8', fontWeight: '700' }}>
                바리스타 효과
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {baristaCandidates.map((player) => {
                  const selected = player.id === baristaTargetId;
                  return (
                    <Pressable
                      key={player.id}
                      onPress={() => setBaristaTargetId(player.id)}
                      style={{
                        borderWidth: 1,
                        borderColor: selected
                          ? colors.arcane.border.brass
                          : '#3a3a42',
                        backgroundColor: selected
                          ? colors.arcane.surface.parchment
                          : '#202026',
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: selected
                            ? colors.arcane.text.label
                            : '#c8c2b8',
                        }}
                      >
                        {player.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedBaristaTarget && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => handleBaristaApply('sober_healthy')}
                    style={{
                      flex: 1,
                      backgroundColor: '#1f3b34',
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#8ee0c0', fontWeight: '700' }}>
                      맑음/건강
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleBaristaApply('acts_twice')}
                    style={{
                      flex: 1,
                      backgroundColor: '#1e2f48',
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#9fc4f0', fontWeight: '700' }}>
                      능력 2회
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {showBmrAssistPanel && activeRolePlayer && (
            <View
              style={{
                marginTop: 12,
                borderWidth: 1,
                borderColor: '#3a3a42',
                backgroundColor: '#17171b',
                padding: 12,
                gap: 10,
              }}
            >
              <Text style={{ color: '#e0ddd8', fontWeight: '700' }}>
                피로물든달 판정 보조
              </Text>
              {activeNightRoleId === 'courtier' && (
                <>
                  <Text style={{ color: '#a9a29a' }}>
                    취하게 할 역할을 선택하세요.
                  </Text>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
                  >
                    {ALL_ROLES.map((role) =>
                      renderChip(
                        role.id,
                        role.name,
                        courtierRoleId === role.id,
                        () => setCourtierRoleId(role.id),
                      ),
                    )}
                  </View>
                  {courtierRoleId && (
                    <Pressable
                      onPress={() => {
                        onCourtierChooseRole?.(
                          activeRolePlayer.id,
                          courtierRoleId,
                          handleBmrAssistResult,
                        );
                      }}
                      style={{
                        backgroundColor: '#293b2f',
                        paddingVertical: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#9bd3a8', fontWeight: '700' }}>
                        궁정대신 적용
                      </Text>
                    </Pressable>
                  )}
                </>
              )}

              {activeNightRoleId === 'gambler' && (
                <>
                  <Text style={{ color: '#a9a29a' }}>
                    도박사가 선언한 플레이어와 역할을 선택하세요.
                  </Text>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
                  >
                    {livingPlayers.map((player) =>
                      renderChip(
                        player.id,
                        player.name,
                        gamblerTargetId === player.id,
                        () => setGamblerTargetId(player.id),
                      ),
                    )}
                  </View>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
                  >
                    {ALL_ROLES.map((role) =>
                      renderChip(
                        role.id,
                        role.name,
                        gamblerRoleId === role.id,
                        () => setGamblerRoleId(role.id),
                      ),
                    )}
                  </View>
                  {gamblerTargetId && gamblerRoleId && (
                    <Pressable
                      onPress={() => {
                        onGamblerGuess?.(
                          activeRolePlayer.id,
                          gamblerTargetId,
                          gamblerRoleId,
                          handleBmrAssistResult,
                        );
                      }}
                      style={{
                        backgroundColor: '#3c2c2f',
                        paddingVertical: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#dda3a8', fontWeight: '700' }}>
                        도박사 판정
                      </Text>
                    </Pressable>
                  )}
                </>
              )}

              {(activeNightRoleId === 'gossip' ||
                activeNightRoleId === 'moonchild') && (
                <>
                  <Text style={{ color: '#a9a29a' }}>
                    {activeNightRoleId === 'gossip'
                      ? '사망시킬 플레이어를 선택하세요.'
                      : '달의 자손이 공개 선택한 플레이어를 선택하세요.'}
                  </Text>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
                  >
                    {livingPlayers.map((player) =>
                      renderChip(
                        player.id,
                        player.name,
                        bmrAssistTargetId === player.id,
                        () => setBmrAssistTargetId(player.id),
                      ),
                    )}
                  </View>
                  {bmrAssistTargetId && (
                    <Pressable
                      onPress={() => {
                        if (activeNightRoleId === 'gossip') {
                          onGossipKill?.(
                            activeRolePlayer.id,
                            bmrAssistTargetId,
                            handleBmrAssistResult,
                          );
                        } else {
                          onMoonchildChoose?.(
                            activeRolePlayer.id,
                            bmrAssistTargetId,
                            handleBmrAssistResult,
                          );
                        }
                      }}
                      style={{
                        backgroundColor: '#302f46',
                        paddingVertical: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#bab6f0', fontWeight: '700' }}>
                        판정 적용
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          {/* Feedback overlay - covers NightOrderPanel */}
          {hasSpyManualFeedback &&
            spyPlayer &&
            !feedbackCollapsed &&
            !isFeedbackSent && (
              <View style={styles.nightFeedbackOverlay}>
                <SpyGrimoireComposer
                  players={players}
                  spyPlayer={spyPlayer}
                  onSend={onSendFeedback}
                  onSent={() => {
                    setFeedbackSentForRole(activeNightRoleId);
                    setFeedbackCollapsed(true);
                  }}
                />
              </View>
            )}

          {hasNightFeedback && !feedbackCollapsed && !isFeedbackSent && (
            <View style={styles.nightFeedbackOverlay}>
              <NightFeedbackPanel
                activeRoleId={activeNightRoleId}
                players={players}
                nightActions={nightActions}
                executedRoleName={executedPlayer?.role?.name}
                executedPlayerName={executedPlayer?.name}
                empathHint={
                  activeNightRoleId === 'empath' && empathNeighborIds.size > 0
                    ? {
                        neighbors: players
                          .filter((p) => empathNeighborIds.has(p.id))
                          .map((p) => ({
                            id: p.id,
                            name: p.name,
                            isEvil: isDetectedAsEvil(p),
                          })),
                        evilCount: empathEvilCount,
                      }
                    : undefined
                }
                chefHint={
                  activeNightRoleId === 'chef'
                    ? {
                        evilPairCount: chefEvilPairCount,
                        evilPairNames: chefEvilPairNames,
                      }
                    : undefined
                }
                onSendFeedback={(playerId, fb) => {
                  onSendFeedback(playerId, fb);
                }}
                onAllFeedbackSent={() => {
                  setFeedbackSentForRole(activeNightRoleId);
                  setFeedbackCollapsed(true);
                }}
                wakeUpTargetIds={nightWakeUpTargets}
                jugglerCorrectCount={jugglerCorrectCount}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
