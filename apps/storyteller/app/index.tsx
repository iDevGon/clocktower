import { getAllTipTexts } from '@clocktower/shared';
import {
  FullScreenVignette,
  RotatingGameTip,
  SmokeParticles,
  STORYTELLER_SMOKE_PARTICLES,
  useReducedMotion,
} from '@clocktower/ui';
import { useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QRScannerModal } from '../src/components/QRScannerModal';
import { useGameActions } from '../src/hooks/useGameActions';
import { useResponsive } from '../src/hooks/useResponsive';
import { useSocketConnection } from '../src/hooks/useSocketConnection';
import { useConnectionStore } from '../src/stores/connectionStore';
import { useGameStore } from '../src/stores/gameStore';
import { createIndexStyles } from '../src/styles/index.styles';

export default function HomeScreen() {
  const tips = useMemo(() => getAllTipTexts('storyteller'), []);
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createIndexStyles(scale), [scale]);

  const [serverIp, setServerIp] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scannedRef = useRef(false);
  const router = useRouter();
  const { connect } = useSocketConnection();
  const { createGame } = useGameActions();
  const [permission, requestPermission] = useCameraPermissions();

  const isConnected = useConnectionStore((s) => s.isConnected);
  const gameId = useGameStore((s) => s.gameState?.id);

  const navigateToGame = useCallback(() => {
    const state = useGameStore.getState().gameState;
    if (!state?.id) return;
    if (!state.started) {
      router.replace('/game/lobby');
      return;
    }
    router.replace('/game/grimoire');
  }, [router]);

  // _layout.tsx가 재접속을 처리함 → 여기서는 연결 완료 시 네비게이션만
  useEffect(() => {
    if (!isConnected || !gameId) return;
    navigateToGame();
  }, [isConnected, gameId, navigateToGame]);

  // Title glow pulse — golden
  const reduced = useReducedMotion();
  const glowPulse = useSharedValue(reduced ? 0.5 : 0);
  useEffect(() => {
    if (reduced) return;
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [glowPulse, reduced]);

  const titleGlowStyle = useAnimatedStyle(() => ({
    textShadowRadius: interpolate(glowPulse.value, [0, 1], [20, 40]),
    opacity: interpolate(glowPulse.value, [0, 1], [0.9, 1]),
  }));

  const dividerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.4, 0.8]),
  }));

  const badgeGlowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(196, 160, 80, ${interpolate(glowPulse.value, [0, 1], [0.2, 0.4])})`,
  }));

  const connectAndCreate = async (url: string) => {
    setError('');
    setIsConnecting(true);
    try {
      await connect(url);
      await createGame();
      router.push('/game/lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : '연결에 실패했습니다.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStart = () => {
    const trimmed = serverIp.trim();
    if (!trimmed) {
      setError('서버 IP를 입력하세요');
      return;
    }
    const url = trimmed.startsWith('http') ? trimmed : `http://${trimmed}:3000`;
    connectAndCreate(url);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    scannedRef.current = false;
    setShowScanner(true);
  };

  const handleBarCodeScanned = (data: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setShowScanner(false);

    const trimmed = data.trim();
    const url = trimmed.startsWith('http') ? trimmed : `http://${trimmed}:3000`;
    try {
      const { host } = new URL(url);
      setServerIp(host);
    } catch {
      setServerIp(trimmed);
    }
    connectAndCreate(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Deep midnight-blue background */}
      <LinearGradient
        colors={['#06080f', '#0a0e1a', '#0e1020', '#0a0c18', '#060810']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={styles.backgroundGradient}
      />

      {/* Atmospheric layers */}
      <SmokeParticles particles={STORYTELLER_SMOKE_PARTICLES} />
      <FullScreenVignette
        color="#04060c"
        opacityRange={[0.5, 0.75]}
        duration={6000}
      />

      <QRScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleBarCodeScanned}
      />

      {/* Main content */}
      <View style={styles.content}>
        {/* Role badge */}
        <Animated.View style={[styles.roleBadge, badgeGlowStyle]}>
          <Text style={styles.roleBadgeIcon}>◉</Text>
          <Text style={styles.roleBadgeText}>이야기꾼</Text>
        </Animated.View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>시계 탑에 흐른</Text>
          <Animated.Text style={[styles.subtitle, titleGlowStyle]}>
            피
          </Animated.Text>
          <View style={styles.titleDivider}>
            <Animated.View style={dividerGlowStyle}>
              <LinearGradient
                colors={[
                  'transparent',
                  '#8b7530',
                  '#c4a050',
                  '#8b7530',
                  'transparent',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.titleDividerGradient}
              />
            </Animated.View>
          </View>
          <View style={styles.decorRow}>
            <Text style={styles.decorStar}>✦</Text>
            <Text style={styles.decorStar}>✦</Text>
            <Text style={styles.decorStar}>✦</Text>
            <Text style={styles.decorDiamond}>◆</Text>
            <Text style={styles.decorStar}>✦</Text>
            <Text style={styles.decorStar}>✦</Text>
            <Text style={styles.decorStar}>✦</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="서버 IP (예: 192.168.0.22)"
              placeholderTextColor="#3a3850"
              value={serverIp}
              onChangeText={setServerIp}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              autoComplete="url"
              textContentType="URL"
            />
            <Pressable
              style={({ pressed }) => [
                styles.qrButton,
                pressed && styles.qrButtonPressed,
              ]}
              onPress={openScanner}
            >
              <Text style={styles.qrButtonText}>QR</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={handleStart}
            disabled={isConnecting}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#3a3010', '#5a4820', '#3a3010']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            />
            {isConnecting ? (
              <ActivityIndicator color="#e0ddd8" />
            ) : (
              <Text style={styles.buttonText}>게임 생성</Text>
            )}
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <RotatingGameTip tips={tips} color="#8b7530" glowColor="#6b5520" />
        </View>
      </View>

      <Text style={styles.copyright}>
        Blood on the Clocktower © The Pandemonium Institute.{'\n'}App by DevGon
      </Text>
    </SafeAreaView>
  );
}
