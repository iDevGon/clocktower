import { getRoleById, NIGHT_ACTIONS, NIGHT_FEEDBACK } from '@clocktower/shared';
import type { Player, PlayerStatus } from '@clocktower/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { createGrimoireStyles } from '../styles/grimoire.styles';
import { NightActionLog, NightFeedbackPanel } from './NightActionLog';
import { NightOrderPanel } from './NightOrderPanel';

interface NightPanelProps {
  day: number;
  players: Player[];
  nightActions: Array<{
    roleId: string;
    playerId: string;
    action: { type: string; targetIds: string[] };
  }>;
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
  onSendFeedback: (playerId: string, feedback: unknown) => void;
  onKill: (playerId: string) => void;
  onSetStatus: (playerId: string, status: PlayerStatus) => void;
  styles: ReturnType<typeof createGrimoireStyles>;
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
  styles,
}: NightPanelProps) {
  const [feedbackCollapsed, setFeedbackCollapsed] = useState(false);
  const [feedbackSentForRole, setFeedbackSentForRole] = useState<string | null>(
    null,
  );
  const [nightOrderComplete, setNightOrderComplete] = useState(false);
  const [nightElapsed, setNightElapsed] = useState(0);
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
    }
  }, [activeNightRoleId]);

  const isFeedbackSent = feedbackSentForRole === activeNightRoleId;

  // Check if current role has feedback to show
  const hasNightFeedback = useMemo(() => {
    if (!activeNightRoleId) return false;
    const fbDef = NIGHT_FEEDBACK[activeNightRoleId];
    if (!fbDef || fbDef.type === 'none' || fbDef.type === 'grimoire')
      return false;
    const target = players.find(
      (p) =>
        p.role?.id === activeNightRoleId ||
        (p.role?.id === 'drunk' && p.drunkAs === activeNightRoleId),
    );
    if (!target) return false;
    if (NIGHT_ACTIONS[activeNightRoleId]?.onlyWhenDead && target.isAlive)
      return false;
    return true;
  }, [activeNightRoleId, players]);

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
          />

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
                  setFeedbackSentForRole(activeNightRoleId);
                  setFeedbackCollapsed(true);
                }}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
