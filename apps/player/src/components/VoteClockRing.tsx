import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';

const RING_SIZE = 240;
const NODE_SIZE = 32;
const CENTER = RING_SIZE / 2;
const RADIUS = RING_SIZE / 2 - NODE_SIZE / 2 - 6;
const HAND_LENGTH = RADIUS - 24;
const TICK_COUNT = 60;
const INNER_RING_RADIUS = RADIUS - 20;

const COLORS = {
  brass: '#b8964e',
  brassLight: '#d4b06a',
  brassDark: '#8a6e38',
  blood: '#8b1a1a',
  bloodGlow: '#c43c3c',
  bloodDeep: '#5a0f0f',
  bone: '#d4cfc6',
  boneFaded: '#9a958c',
  iron: '#4a4a52',
  ironDark: '#2a2a30',
  midnight: '#0d0d12',
  midnightLight: '#16161e',
  active: '#e8c44a',
  activeGlow: '#f5d76e',
  activeDark: '#b8942a',
  guilty: '#c43c3c',
  innocent: '#6080b0',
};

export function VoteClockRing() {
  const voteOrder = usePlayerStore((s) => s.voteOrder);
  const voteClock = usePlayerStore((s) => s.voteClock);
  const playerId = usePlayerStore((s) => s.playerId);
  const nomination = usePlayerStore((s) => s.nomination);
  const votePreselections = usePlayerStore((s) => s.votePreselections);

  const [handAngle, setHandAngle] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  const hasVoteOrder = !!voteOrder && voteOrder.order.length > 0;

  // fullOrder rotated so current player is at 12 o'clock
  const allNodes = useMemo(() => {
    if (!hasVoteOrder || !voteOrder) return [];
    if (voteOrder.fullOrder && voteOrder.fullOrder.length > 0) {
      const full = voteOrder.fullOrder;
      const myIndex = full.findIndex((p) => p.id === playerId);
      if (myIndex > 0) {
        return [...full.slice(myIndex), ...full.slice(0, myIndex)];
      }
      return full;
    }
    const nomineeId = voteOrder.nomineeId;
    return [
      { id: nomineeId, name: nomination?.nomineeName ?? '?', isAlive: true },
      ...voteOrder.order.map((p) => ({ ...p, isAlive: true })),
    ];
  }, [hasVoteOrder, voteOrder, playerId, nomination?.nomineeName]);

  const totalNodes = allNodes.length;
  const nomineeId = voteOrder?.nomineeId ?? '';

  // Nominee's angle in the rotated circle
  const nomineeAngle = useMemo(() => {
    if (totalNodes === 0) return 0;
    const nIdx = allNodes.findIndex((n) => n.id === nomineeId);
    if (nIdx < 0) return 0;
    return (nIdx / totalNodes) * 360;
  }, [allNodes, totalNodes, nomineeId]);

  // Animate hand based on clock progress
  useEffect(() => {
    if (!hasVoteOrder || !voteClock) {
      setHandAngle(nomineeAngle);
      return;
    }

    function tick() {
      const elapsed = Date.now() - voteClock.startedAt;
      const progress = Math.min(elapsed / voteClock.durationMs, 1);
      setHandAngle(nomineeAngle + progress * 360);
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    }

    tick();
    return () => {
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [hasVoteOrder, voteClock, nomineeAngle]);

  if (!hasVoteOrder) return null;

  // Compute remaining time
  const remainingMs = voteClock
    ? Math.max(0, voteClock.durationMs - (Date.now() - voteClock.startedAt))
    : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const isUrgent = voteClock
    ? remainingMs < voteClock.durationMs * 0.15
    : false;

  // Vote order set (participants)
  const voteOrderIds = new Set(voteOrder?.order.map((p) => p.id) ?? []);
  if (nomineeId) voteOrderIds.add(nomineeId);

  // Current hand progress (degrees swept from nominee)
  const handProgress = voteClock
    ? Math.min((Date.now() - voteClock.startedAt) / voteClock.durationMs, 1) *
      360
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.outerGlow} />

      <View style={styles.clockFace}>
        <View style={styles.outerRing} />

        {/* Tick marks */}
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
          const isMajor = i % 5 === 0;
          const tickLen = isMajor ? 8 : 4;
          const tickWidth = isMajor ? 1.5 : 0.8;
          const outerR = RADIUS + 4;
          const x1 = CENTER + (outerR - tickLen) * Math.cos(angle);
          const y1 = CENTER + (outerR - tickLen) * Math.sin(angle);
          const x2 = CENTER + outerR * Math.cos(angle);
          const y2 = CENTER + outerR * Math.sin(angle);
          const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          const deg = (angle * 180) / Math.PI + 90;

          return (
            <View
              key={`t-${i}`}
              style={{
                position: 'absolute',
                left: x1 - tickWidth / 2,
                top: y1,
                width: tickWidth,
                height: length,
                backgroundColor: isMajor
                  ? COLORS.brassDark
                  : `${COLORS.iron}80`,
                transform: [{ rotate: `${deg}deg` }],
                transformOrigin: 'top',
              }}
            />
          );
        })}

        <View style={styles.innerRing} />

        {/* Active voter wedge glow */}
        {voteClock && (
          <View
            style={[
              styles.wedgeContainer,
              {
                transform: [{ rotate: `${handAngle}deg` }],
              },
            ]}
          >
            <View style={styles.wedgeOuter} />
            <View style={styles.wedgeInner} />
          </View>
        )}

        {/* Clock hand */}
        <View
          style={[
            styles.handContainer,
            {
              transform: [{ rotate: `${handAngle}deg` }],
            },
          ]}
        >
          <View
            style={[
              styles.handGlow,
              {
                height: HAND_LENGTH,
                backgroundColor: isUrgent
                  ? `${COLORS.bloodGlow}40`
                  : `${COLORS.brass}30`,
              },
            ]}
          />
          <View
            style={[
              styles.hand,
              {
                height: HAND_LENGTH,
                backgroundColor: isUrgent ? COLORS.bloodGlow : COLORS.brass,
              },
            ]}
          />
          <View
            style={[
              styles.handTip,
              {
                borderBottomColor: isUrgent
                  ? COLORS.bloodGlow
                  : COLORS.brassLight,
              },
            ]}
          />
        </View>

        {/* Center ornament */}
        <View style={styles.centerOrnament}>
          <View
            style={[
              styles.centerDot,
              isUrgent && { backgroundColor: COLORS.bloodGlow },
            ]}
          />
        </View>

        {/* Timer text */}
        {voteClock && (
          <View style={styles.timerContainer}>
            <Text
              style={[
                styles.timerText,
                isUrgent && {
                  color: COLORS.bloodGlow,
                  textShadowColor: `${COLORS.bloodGlow}80`,
                },
              ]}
            >
              {remainingSec}
            </Text>
          </View>
        )}

        {/* Player nodes */}
        {allNodes.map((node, index) => {
          const angle = (index / totalNodes) * 2 * Math.PI - Math.PI / 2;
          const x = CENTER + RADIUS * Math.cos(angle) - NODE_SIZE / 2;
          const y = CENTER + RADIUS * Math.sin(angle) - NODE_SIZE / 2;
          const isNominee = node.id === nomineeId;
          const isMe = node.id === playerId;
          const isVoter = voteOrderIds.has(node.id);
          const preselection = votePreselections[node.id];

          // Has the hand passed this player?
          const nodeAngleDeg = (index / totalNodes) * 360;
          const nodeOffset = (nodeAngleDeg - nomineeAngle + 360) % 360;
          // nominee itself (offset=0) is confirmed at the end (360)
          const confirmOffset =
            nodeOffset === 0 && !isNominee
              ? 0
              : nodeOffset === 0
                ? 360
                : nodeOffset;
          const hasPassed = handProgress >= confirmOffset;

          // Is the hand currently near this player?
          const distToHand = Math.abs(
            handProgress - (nodeOffset === 0 && isNominee ? 360 : nodeOffset),
          );
          const isNearHand =
            distToHand < (360 / totalNodes) * 0.5 && !hasPassed;

          const showGuilty = preselection === true && hasPassed;
          const showInnocent = preselection === false && hasPassed;
          // Default to innocent if passed with no preselection
          const showDefaultInnocent =
            hasPassed && preselection == null && isVoter && !isNominee;
          // Preselection hint (before hand passes)
          const showPreselectedGuilty =
            !hasPassed && preselection === true && isVoter && !isNominee;
          const showPreselectedInnocent =
            !hasPassed && preselection === false && isVoter && !isNominee;

          return (
            <View
              key={node.id}
              style={[
                styles.node,
                {
                  left: x,
                  top: y,
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                },
                !node.isAlive && !isNominee && styles.deadNode,
                !isVoter && !isNominee && styles.nonVoterNode,
                isNominee && styles.nomineeNode,
                isNearHand && isVoter && styles.activeNode,
                isMe && !isNearHand && !isNominee && styles.myNode,
                hasPassed && showGuilty && styles.guiltyNode,
                hasPassed &&
                  (showInnocent || showDefaultInnocent) &&
                  styles.innocentNode,
                hasPassed &&
                  !showGuilty &&
                  !showInnocent &&
                  !showDefaultInnocent &&
                  styles.pastNode,
                !isNearHand && showPreselectedGuilty && styles.preselectedGuiltyNode,
                !isNearHand && showPreselectedInnocent && styles.preselectedInnocentNode,
              ]}
            >
              <Text
                style={[
                  styles.nodeText,
                  isNominee && styles.nomineeText,
                  isNearHand && isVoter && styles.activeText,
                  isMe && !isNearHand && styles.myText,
                  hasPassed && showGuilty && { color: COLORS.guilty },
                  hasPassed &&
                    (showInnocent || showDefaultInnocent) && {
                      color: COLORS.innocent,
                    },
                ]}
                numberOfLines={1}
              >
                {node.name.charAt(0)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {allNodes
          .filter((n) => voteOrderIds.has(n.id) || n.id === nomineeId)
          .map((node) => {
            const isMe = node.id === playerId;
            const isNominee = node.id === nomineeId;
            const preselection = votePreselections[node.id];
            // Check if passed
            const nodeIdx = allNodes.findIndex((n) => n.id === node.id);
            const nodeAngleDeg = (nodeIdx / totalNodes) * 360;
            const nodeOffset = (nodeAngleDeg - nomineeAngle + 360) % 360;
            const confirmOffset =
              nodeOffset === 0 && isNominee ? 360 : nodeOffset;
            const hasPassed = handProgress >= confirmOffset;

            const isVoter = voteOrderIds.has(node.id);

            return (
              <Text
                key={node.id}
                style={[
                  styles.legendText,
                  isNominee && { color: COLORS.bloodGlow },
                  isMe && { color: COLORS.brass },
                  hasPassed &&
                    preselection === true && { color: COLORS.guilty },
                  hasPassed &&
                    preselection !== true && { color: COLORS.innocent },
                  !hasPassed &&
                    !isNominee &&
                    isVoter &&
                    preselection === true && {
                      color: `${COLORS.guilty}90`,
                    },
                  !hasPassed &&
                    !isNominee &&
                    isVoter &&
                    preselection === false && {
                      color: `${COLORS.innocent}90`,
                    },
                ]}
                numberOfLines={1}
              >
                {node.name}
              </Text>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  outerGlow: {
    position: 'absolute',
    width: RING_SIZE + 30,
    height: RING_SIZE + 30,
    borderRadius: (RING_SIZE + 30) / 2,
    backgroundColor: `${COLORS.blood}15`,
    top: -3,
  },
  clockFace: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
    backgroundColor: COLORS.midnight,
    borderRadius: RING_SIZE / 2,
  },
  outerRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    borderColor: COLORS.brassDark,
    shadowColor: COLORS.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  innerRing: {
    position: 'absolute',
    left: CENTER - INNER_RING_RADIUS,
    top: CENTER - INNER_RING_RADIUS,
    width: INNER_RING_RADIUS * 2,
    height: INNER_RING_RADIUS * 2,
    borderRadius: INNER_RING_RADIUS,
    borderWidth: 0.8,
    borderColor: `${COLORS.brassDark}40`,
  },
  wedgeContainer: {
    position: 'absolute',
    left: CENTER - RADIUS * 0.55,
    top: CENTER - RADIUS,
    width: RADIUS * 1.1,
    height: RADIUS,
    transformOrigin: `${RADIUS * 0.55}px ${RADIUS}px`,
    zIndex: 4,
  },
  wedgeOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: RADIUS * 0.55,
    borderRightWidth: RADIUS * 0.55,
    borderBottomWidth: RADIUS,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: `${COLORS.active}08`,
  },
  wedgeInner: {
    position: 'absolute',
    bottom: 0,
    left: RADIUS * 0.55 - RADIUS * 0.22,
    width: 0,
    height: 0,
    borderLeftWidth: RADIUS * 0.22,
    borderRightWidth: RADIUS * 0.22,
    borderBottomWidth: RADIUS * 0.7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: `${COLORS.active}12`,
  },
  handContainer: {
    position: 'absolute',
    left: CENTER - 4,
    top: CENTER - HAND_LENGTH,
    width: 8,
    height: HAND_LENGTH,
    alignItems: 'center',
    transformOrigin: `4px ${HAND_LENGTH}px`,
    zIndex: 10,
  },
  handGlow: {
    position: 'absolute',
    width: 8,
    borderRadius: 4,
  },
  hand: {
    position: 'absolute',
    width: 2.5,
    borderRadius: 1.5,
  },
  handTip: {
    position: 'absolute',
    top: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  centerOrnament: {
    position: 'absolute',
    left: CENTER - 8,
    top: CENTER - 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.ironDark,
    borderWidth: 1.5,
    borderColor: COLORS.brassDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.brass,
  },
  timerContainer: {
    position: 'absolute',
    left: CENTER - 18,
    top: CENTER + 18,
    width: 36,
    alignItems: 'center',
    zIndex: 12,
  },
  timerText: {
    color: COLORS.bone,
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textShadowColor: `${COLORS.brass}40`,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  node: {
    position: 'absolute',
    borderRadius: 16,
    backgroundColor: COLORS.midnightLight,
    borderWidth: 2,
    borderColor: COLORS.iron,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  deadNode: {
    opacity: 0.25,
  },
  nonVoterNode: {
    opacity: 0.3,
    borderColor: `${COLORS.iron}60`,
  },
  nomineeNode: {
    backgroundColor: COLORS.bloodDeep,
    borderColor: COLORS.bloodGlow,
    shadowColor: COLORS.bloodGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  activeNode: {
    backgroundColor: `${COLORS.activeDark}30`,
    borderColor: COLORS.active,
    shadowColor: COLORS.activeGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  myNode: {
    borderColor: COLORS.brass,
  },
  guiltyNode: {
    borderColor: COLORS.guilty,
    backgroundColor: `${COLORS.guilty}20`,
  },
  innocentNode: {
    borderColor: COLORS.innocent,
    backgroundColor: `${COLORS.innocent}20`,
  },
  preselectedGuiltyNode: {
    borderColor: `${COLORS.guilty}70`,
    borderStyle: 'dashed',
  },
  preselectedInnocentNode: {
    borderColor: `${COLORS.innocent}70`,
    borderStyle: 'dashed',
  },
  pastNode: {
    opacity: 0.35,
  },
  nodeText: {
    color: COLORS.boneFaded,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nomineeText: {
    color: COLORS.bloodGlow,
  },
  activeText: {
    color: COLORS.activeGlow,
  },
  myText: {
    color: COLORS.brassLight,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  legendText: {
    color: COLORS.boneFaded,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
