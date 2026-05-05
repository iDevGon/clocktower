import type {
  NightAction,
  NightFeedbackPayload,
  Player,
  PlayerStatus,
} from '@clocktower/shared';
import { getRoleById, NIGHT_ACTIONS, NIGHT_FEEDBACK } from '@clocktower/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { createGrimoireStyles } from '../styles/grimoire.styles';
import { NightActionLog, NightFeedbackPanel } from './NightActionLog';
import { NightOrderPanel } from './NightOrderPanel';

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
  playerOrder: string[];
  onActivateRole: (roleId: string | null) => void;
  onNightComplete: () => void;
  onSendFeedback: (playerId: string, feedback: NightFeedbackPayload) => void;
  onKill: (playerId: string) => void;
  onSetStatus: (playerId: string, status: PlayerStatus) => void;
  onFangGuJump?: (oldDemonId: string, newDemonId: string) => void;
  onSnakeCharmerSwap?: (snakeCharmerId: string, demonId: string) => void;
  onVigormortisKillMinion?: (
    vigormortisId: string,
    minionId: string,
    poisonedNeighborId: string,
  ) => void;
  onPitHagChangeRole?: (targetPlayerId: string, newRoleId: string) => void;
  onBoneCollectorRestore?: (
    boneCollectorId: string,
    targetPlayerId: string,
  ) => void;
  onApplyBaristaEffect?: (
    targetPlayerId: string,
    effect: 'sober_healthy' | 'acts_twice',
  ) => void;
  nightWakeUpTargets: string[];
  styles: ReturnType<typeof createGrimoireStyles>;
  /** 에디션 ID (밤 순서 결정에 사용) */
  editionId?: string;
  /** 곡예사 추측의 정답 수 (playerId → count) */
  jugglerCorrectCount?: Record<string, number>;
  /** 표준 night order에 없지만 추가로 활성화 가능한 역할 (예: 철학자가 부여받은 첫 밤 역할) */
  extraNightRoleIds?: string[];
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
  playerOrder,
  onActivateRole,
  onNightComplete,
  onSendFeedback,
  onKill,
  onSetStatus,
  onFangGuJump,
  onSnakeCharmerSwap,
  onVigormortisKillMinion,
  onPitHagChangeRole,
  onBoneCollectorRestore,
  onApplyBaristaEffect,
  nightWakeUpTargets,
  styles,
  editionId,
  jugglerCorrectCount,
  extraNightRoleIds,
}: NightPanelProps) {
  const [feedbackCollapsed, setFeedbackCollapsed] = useState(false);
  const [feedbackSentForRole, setFeedbackSentForRole] = useState<string | null>(
    null,
  );
  const [nightOrderComplete, setNightOrderComplete] = useState(false);
  const [nightElapsed, setNightElapsed] = useState(0);
  const [baristaTargetId, setBaristaTargetId] = useState<string | null>(null);
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
          : p.isAlive || p.statuses.includes('vigormortis_retained')),
    );
  }, [activeNightRoleId, players, nightWakeUpTargets]);

  // Expose nightOrderComplete to parent
  useEffect(() => {
    if (nightOrderComplete) {
      onNightComplete();
    }
  }, [nightOrderComplete, onNightComplete]);

  // Chef evil pair names computation
  const chefEvilPairNames = useMemo(() => {
    if (activeNightRoleId !== 'chef') return [];
    const order = playerOrder;
    const pairs: string[][] = [];
    for (let i = 0; i < order.length; i++) {
      const curr = order[i];
      const next = order[(i + 1) % order.length];
      const cp = players.find((p) => p.id === curr);
      const np = players.find((p) => p.id === next);
      const isEvil = (p: typeof cp) =>
        p?.role?.team === 'minion' || p?.role?.team === 'demon';
      if (isEvil(cp) && isEvil(np)) {
        pairs.push([cp?.name ?? '', np?.name ?? '']);
      }
    }
    return pairs;
  }, [activeNightRoleId, playerOrder, players]);

  const baristaCandidates = useMemo(
    () => players.filter((p) => p.isAlive),
    [players],
  );
  const selectedBaristaTarget = baristaTargetId
    ? players.find((p) => p.id === baristaTargetId)
    : null;

  const handleBaristaApply = (effect: 'sober_healthy' | 'acts_twice') => {
    if (!baristaTargetId) return;
    onApplyBaristaEffect?.(baristaTargetId, effect);
    setFeedbackSentForRole(activeNightRoleId);
  };

  return (
    <View>
      {nightActions.length > 0 && (
        <NightActionLog
          actions={nightActions}
          players={players}
          playerStatuses={playerStatuses}
          onSendFeedback={onSendFeedback}
          onKill={onKill}
          onSetStatus={onSetStatus}
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
        {hasNightFeedback &&
          activeNightRoleId &&
          (() => {
            const role = getRoleById(activeNightRoleId);
            const m = Math.floor(nightElapsed / 60);
            const sec = nightElapsed % 60;
            return (
              <View style={styles.nightFloatingTimer}>
                <Text style={styles.nightFloatingTimerRole}>
                  {role?.name ?? activeNightRoleId}
                </Text>
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
                        borderColor: selected ? '#d4a84f' : '#3a3a42',
                        backgroundColor: selected ? '#2b2418' : '#202026',
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ color: selected ? '#f0d48a' : '#c8c2b8' }}>
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

          {/* Feedback overlay - covers NightOrderPanel */}
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
                            isEvil:
                              p.role?.team === 'minion' ||
                              p.role?.team === 'demon',
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
