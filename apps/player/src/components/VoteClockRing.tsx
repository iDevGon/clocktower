import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { usePlayerStore } from '../stores/playerStore';
import {
  CENTER,
  COLORS,
  NODE_SIZE,
  RADIUS,
  RING_SIZE,
  styles,
  TICK_COUNT,
} from './VoteClockRing.styles';

// Pre-computed tick mark data (avoid recalculating 60 trig ops per render)
const TICK_DATA = Array.from({ length: TICK_COUNT }, (_, i) => {
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
  return {
    left: x1 - tickWidth / 2,
    top: y1,
    width: tickWidth,
    height: length,
    backgroundColor: isMajor ? COLORS.brassDark : `${COLORS.iron}80`,
    rotate: `${deg}deg`,
  };
});

// Pre-generated smoke particle configurations
const SMOKE_COUNT = 10;
const SMOKE_CONFIGS = Array.from({ length: SMOKE_COUNT }, (_, i) => {
  const baseAngle = (i / SMOKE_COUNT) * 360;
  const jitter = (Math.random() - 0.5) * (360 / SMOKE_COUNT) * 0.7;
  return {
    angle: baseAngle + jitter,
    delay: Math.random() * 3000,
    duration: 2200 + Math.random() * 1800,
    size: 6 + Math.random() * 8,
    drift: 18 + Math.random() * 22,
    lateralDrift: (Math.random() - 0.5) * 12,
    maxOpacity: 0.15 + Math.random() * 0.2,
  };
});

function SmokeParticle({ config }: { config: (typeof SMOKE_CONFIGS)[0] }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: config.duration,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );
  }, [config.delay, config.duration, progress]);

  const rad = (config.angle * Math.PI) / 180;
  const borderR = RING_SIZE / 2 + 1;
  const baseX = CENTER + borderR * Math.cos(rad) - config.size / 2;
  const baseY = CENTER + borderR * Math.sin(rad) - config.size / 2;
  const outX =
    Math.cos(rad) * config.drift + Math.sin(rad) * config.lateralDrift;
  const outY =
    Math.sin(rad) * config.drift - Math.cos(rad) * config.lateralDrift;
  const maxOp = config.maxOpacity;

  const animStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const fade =
      p < 0.15 ? (p / 0.15) * maxOp : maxOp * (1 - (p - 0.15) / 0.85);
    return {
      opacity: Math.max(0, fade),
      transform: [
        { translateX: outX * p },
        { translateY: outY * p },
        { scale: 1 + p * 0.7 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: baseX,
          top: baseY,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: COLORS.smoke,
          shadowColor: COLORS.smoke,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: config.size,
        },
        animStyle,
      ]}
    />
  );
}

interface PlayerNodeProps {
  node: { id: string; name: string; isAlive: boolean; deadVoteUsed?: boolean };
  index: number;
  totalNodes: number;
  nomineeId: string;
  playerId: string;
  nomineeAngle: number;
  halfSlot: number;
  handProgress: number;
  isVoter: boolean;
  preselection: boolean | null | undefined;
}

const PlayerNode = React.memo(function PlayerNode({
  node,
  index,
  totalNodes,
  nomineeId,
  playerId,
  nomineeAngle,
  halfSlot,
  handProgress,
  isVoter,
  preselection,
}: PlayerNodeProps) {
  const angle = (index / totalNodes) * 2 * Math.PI - Math.PI / 2;
  const x = CENTER + RADIUS * Math.cos(angle) - NODE_SIZE / 2;
  const y = CENTER + RADIUS * Math.sin(angle) - NODE_SIZE / 2;
  const isNominee = node.id === nomineeId;
  const isMe = node.id === playerId;

  const nodeAngleDeg = (index / totalNodes) * 360;
  const nodeOffset = (nodeAngleDeg - nomineeAngle + 360) % 360;
  const confirmOffset =
    nodeOffset === 0 && !isNominee ? 0 : nodeOffset === 0 ? 360 : nodeOffset;
  const hasPassed = handProgress >= confirmOffset;

  const distToHand = Math.abs(
    handProgress +
      halfSlot -
      (nodeOffset === 0 && isNominee ? 360 : nodeOffset),
  );
  const isNearHand = distToHand < (360 / totalNodes) * 0.5 && !hasPassed;

  const showVoted = preselection === true && hasPassed;
  const showPreselectedVote =
    !hasPassed && preselection === true && (isVoter || isNominee);

  return (
    <View
      style={[
        styles.node,
        {
          left: x,
          top: y,
          width: NODE_SIZE,
          height: NODE_SIZE,
        },
        !node.isAlive && !isNominee && node.deadVoteUsed && styles.deadNode,
        !node.isAlive &&
          !isNominee &&
          !node.deadVoteUsed &&
          styles.deadWithVoteNode,
        !isVoter && !isNominee && styles.nonVoterNode,
        isNominee && styles.nomineeNode,
        isMe && !isNearHand && !isNominee && styles.myNode,
        !isNearHand && showPreselectedVote && styles.preselectedGuiltyNode,
        hasPassed && showVoted && styles.guiltyNode,
        hasPassed && !showVoted && styles.pastNode,
        isNearHand && isVoter && styles.activeNode,
      ]}
    >
      <Text
        style={[
          styles.nodeText,
          isNominee && styles.nomineeText,
          isMe && !isNearHand && styles.myText,
          hasPassed && showVoted && { color: '#fff' },
          isNearHand && isVoter && styles.activeText,
        ]}
        numberOfLines={1}
      >
        {node.name.charAt(0)}
      </Text>
      {hasPassed && showVoted && <Text style={styles.voteEmoji}>✋🏻</Text>}
      {!hasPassed && showPreselectedVote && (
        <Text style={styles.preselectedVoteEmoji}>✋🏻</Text>
      )}
    </View>
  );
});

export function VoteClockRing() {
  const voteOrder = usePlayerStore((s) => s.voteOrder);
  const voteClock = usePlayerStore((s) => s.voteClock);
  const playerId = usePlayerStore((s) => s.playerId);
  const nomination = usePlayerStore((s) => s.nomination);
  const votePreselections = usePlayerStore((s) => s.votePreselections);

  const handAngleSV = useSharedValue(0);
  const handProgressRef = useRef(0);
  const [, forceRenderNodes] = useState(0);

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

  // Offset by half a player slot so the hand passes through each player's
  // center at the midpoint of their voting window, not at the end.
  const halfSlot = totalNodes > 0 ? 180 / totalNodes : 0;

  // Animate hand on UI thread via Reanimated (no JS-thread state updates per frame)
  useEffect(() => {
    if (!hasVoteOrder || !voteClock) {
      cancelAnimation(handAngleSV);
      handAngleSV.value = nomineeAngle + halfSlot;
      handProgressRef.current = 0;
      forceRenderNodes((n) => n + 1);
      return;
    }

    const elapsed = Date.now() - voteClock.startedAt;
    const initialProgress = Math.min(elapsed / voteClock.durationMs, 1);
    const remainingMs = (1 - initialProgress) * voteClock.durationMs;

    cancelAnimation(handAngleSV);
    handAngleSV.value = nomineeAngle + halfSlot + initialProgress * 360;
    if (remainingMs > 0) {
      handAngleSV.value = withTiming(nomineeAngle + halfSlot + 360, {
        duration: remainingMs,
        easing: Easing.linear,
      });
    }

    handProgressRef.current = initialProgress * 360;
    forceRenderNodes((n) => n + 1);
    if (initialProgress >= 1) return;

    const interval = setInterval(() => {
      const e = Date.now() - voteClock.startedAt;
      const p = Math.min(e / voteClock.durationMs, 1);
      handProgressRef.current = p * 360;
      forceRenderNodes((n) => n + 1);
      if (p >= 1) clearInterval(interval);
    }, 500);

    return () => clearInterval(interval);
  }, [hasVoteOrder, voteClock, nomineeAngle, halfSlot, handAngleSV]);

  const daggerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${handAngleSV.value}deg` }],
  }));

  if (!hasVoteOrder) return null;

  // Compute remaining time
  const remainingMs = voteClock
    ? Math.max(0, voteClock.durationMs - (Date.now() - voteClock.startedAt))
    : 0;
  const isUrgent = voteClock
    ? remainingMs < voteClock.durationMs * 0.15
    : false;

  // Format as S.CC (e.g. "12.40")
  const formatTimer = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const centisec = Math.floor((ms % 1000) / 10);
    return `${sec}.${centisec.toString().padStart(2, '0')}`;
  };
  const remainingDisplay = formatTimer(remainingMs);

  // Compute "my turn" remaining time — only show during my actual slot
  let myTurnRemainingMs = 0;
  let isMyTurnNow = false;
  const myNodeIdx = allNodes.findIndex((n) => n.id === playerId);
  if (voteClock && myNodeIdx >= 0 && totalNodes > 0) {
    const myAngleDeg = (myNodeIdx / totalNodes) * 360;
    const myOffset = (myAngleDeg - nomineeAngle + 360) % 360;
    const myConfirmFraction =
      myOffset === 0 && playerId !== nomineeId
        ? 0
        : myOffset === 0
          ? 1
          : myOffset / 360;
    const slotFraction = 1 / totalNodes;
    const mySlotStart = myConfirmFraction - slotFraction;
    const elapsed = Date.now() - voteClock.startedAt;
    const progress = Math.min(elapsed / voteClock.durationMs, 1);
    // Only active during my slot (from slot start to confirm point)
    if (progress >= mySlotStart && progress < myConfirmFraction) {
      isMyTurnNow = true;
      myTurnRemainingMs = (myConfirmFraction - progress) * voteClock.durationMs;
    }
  }
  const myTurnDisplay = formatTimer(myTurnRemainingMs);

  // Vote order set (participants)
  const voteOrderIds = new Set(voteOrder?.order.map((p) => p.id) ?? []);
  if (nomineeId) voteOrderIds.add(nomineeId);

  // handProgress is updated via 500ms interval in the effect above

  return (
    <View style={styles.container}>
      <View style={styles.outerGlow} />

      <View style={styles.clockOuter}>
        <View style={styles.clockFace}>
          <View style={styles.outerRing} />

          {/* Tick marks (pre-computed) */}
          {TICK_DATA.map((t, i) => (
            <View
              key={`t-${i}`}
              style={{
                position: 'absolute',
                left: t.left,
                top: t.top,
                width: t.width,
                height: t.height,
                backgroundColor: t.backgroundColor,
                transform: [{ rotate: t.rotate }],
                transformOrigin: 'top',
              }}
            />
          ))}

          <View style={styles.innerRing} />

          {/* Dagger hand */}
          <Animated.View style={[styles.daggerContainer, daggerStyle]}>
            {/* Blade tip (triangle) */}
            <View
              style={[styles.bladeTip, isUrgent && styles.bladeTipUrgent]}
            />
            {/* Blade body */}
            <View style={[styles.blade, isUrgent && styles.bladeUrgent]} />
            {/* Blood groove (fuller) */}
            <View style={styles.bloodGroove} />
            {/* Crossguard */}
            <View
              style={[styles.crossguard, isUrgent && styles.crossguardUrgent]}
            />
            {/* Grip */}
            <View style={styles.grip} />
            {/* Pommel */}
            <View style={styles.pommel} />
          </Animated.View>

          {/* Center ornament */}
          <View style={styles.centerOrnament}>
            <View
              style={[
                styles.centerDot,
                isUrgent && { backgroundColor: COLORS.bloodGlow },
              ]}
            />
          </View>

          {/* My turn timer — above center */}
          {voteClock && isMyTurnNow && (
            <View style={styles.myTurnTimerContainer}>
              <Text style={styles.myTurnTimerText}>{myTurnDisplay}</Text>
            </View>
          )}

          {/* Total remaining timer — below center */}
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
                {remainingDisplay}
              </Text>
            </View>
          )}

          {/* Player nodes */}
          {allNodes.map((node, index) => (
            <PlayerNode
              key={node.id}
              node={node}
              index={index}
              totalNodes={totalNodes}
              nomineeId={nomineeId}
              playerId={playerId}
              nomineeAngle={nomineeAngle}
              halfSlot={halfSlot}
              handProgress={handProgressRef.current}
              isVoter={voteOrderIds.has(node.id)}
              preselection={votePreselections[node.id]}
            />
          ))}
        </View>

        {/* Smoke particles — only when clock is active */}
        {voteClock && (
          <View style={styles.smokeLayer} pointerEvents="none">
            {SMOKE_CONFIGS.map((config, i) => (
              <SmokeParticle key={`s-${i}`} config={config} />
            ))}
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {allNodes
          .filter((n) => voteOrderIds.has(n.id) || n.id === nomineeId)
          .map((node) => {
            const isMe = node.id === playerId;
            const isNominee = node.id === nomineeId;
            const preselection = votePreselections[node.id];
            const nodeIdx = allNodes.findIndex((n) => n.id === node.id);
            const nodeAngleDeg = (nodeIdx / totalNodes) * 360;
            const nodeOffset = (nodeAngleDeg - nomineeAngle + 360) % 360;
            const confirmOffset =
              nodeOffset === 0 && isNominee ? 360 : nodeOffset;
            const hasPassed = handProgressRef.current >= confirmOffset;

            const isVoter = voteOrderIds.has(node.id);

            return (
              <Text
                key={node.id}
                style={[
                  styles.legendText,
                  isNominee && { color: COLORS.bloodGlow },
                  isMe && !hasPassed && { color: COLORS.myGold },
                  hasPassed &&
                    preselection === true && { color: COLORS.guilty },
                  !hasPassed &&
                    !isNominee &&
                    isVoter &&
                    preselection === true && {
                      color: `${COLORS.guilty}90`,
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
