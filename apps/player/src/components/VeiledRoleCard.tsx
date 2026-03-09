import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const VEIL_PHRASES = [
  '운명이 결정되었습니다',
  '당신의 역할이 기다리고 있습니다',
  '어둠 속에 답이 숨어 있습니다',
  '곧 베일이 벗겨집니다',
  '당신은 누구인가요?',
];

export function VeiledRoleCard() {
  const shimmer = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const phraseIndex = useRef(Math.floor(Math.random() * VEIL_PHRASES.length));

  useEffect(() => {
    const shimmerAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]),
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    shimmerAnim.start();
    pulseAnim.start();

    return () => {
      shimmerAnim.stop();
      pulseAnim.stop();
    };
  }, [shimmer, pulse]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-280, 280],
  });

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [0, 0.8, 1, 0.8, 0],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.4],
  });

  const phraseOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  return (
    <View style={styles.wrapper}>
      {/* Outer glow */}
      <Animated.View style={[styles.outerGlow, { opacity: glowOpacity }]} />

      <View style={styles.card}>
        {/* Shimmer overlay with gradient */}
        <Animated.View
          style={[
            styles.shimmerContainer,
            {
              transform: [{ translateX: shimmerTranslate }],
              opacity: shimmerOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={[
              'transparent',
              'rgba(100, 120, 200, 0.04)',
              'rgba(120, 140, 220, 0.10)',
              'rgba(100, 120, 200, 0.04)',
              'transparent',
            ]}
            locations={[0, 0.2, 0.5, 0.8, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>

        {/* Veil pattern - decorative dots */}
        <View style={styles.veilPattern}>
          {Array.from({ length: 5 }).map((_, row) => (
            <View key={`row-${row}`} style={styles.dotRow}>
              {Array.from({ length: 7 }).map((_, col) => (
                <View
                  key={`dot-${row}-${col}`}
                  style={[
                    styles.dot,
                    {
                      opacity: 0.08 + Math.random() * 0.12,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.teamLabel}>???</Text>
          <View style={styles.mysteryRow}>
            <View style={styles.mysteryLine} />
            <Text style={styles.questionMark}>?</Text>
            <View style={styles.mysteryLine} />
          </View>

          <View style={styles.divider} />

          <Animated.Text style={[styles.phrase, { opacity: phraseOpacity }]}>
            {VEIL_PHRASES[phraseIndex.current]}
          </Animated.Text>

          <View style={styles.sealContainer}>
            <Animated.View
              style={[styles.sealGlow, { opacity: glowOpacity }]}
            />
            <View style={styles.seal}>
              <Text style={styles.sealIcon}>&#x2726;</Text>
            </View>
          </View>

          <Text style={styles.hint}>게임이 시작되면 공개됩니다</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  outerGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 18,
    backgroundColor: '#4a5a8a',
  },
  card: {
    backgroundColor: '#16161a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3050',
    padding: 20,
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 180,
    left: '50%',
    marginLeft: -90,
  },
  shimmerGradient: {
    flex: 1,
    transform: [{ skewX: '-15deg' }],
  },
  veilPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-evenly',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6878a8',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  teamLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 4,
    color: '#4a5070',
    marginBottom: 8,
  },
  mysteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  mysteryLine: {
    width: 40,
    height: 1,
    backgroundColor: '#3a4060',
  },
  questionMark: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5a6898',
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: '#242838',
    marginBottom: 16,
  },
  phrase: {
    color: '#7080b0',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  sealContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sealGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5a6898',
  },
  seal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3a4060',
    backgroundColor: '#1c1e28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealIcon: {
    color: '#5a6898',
    fontSize: 16,
  },
  hint: {
    color: '#3a3e4a',
    fontSize: 11,
    letterSpacing: 1,
  },
});
