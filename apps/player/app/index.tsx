import { getAllTipTexts } from '@clocktower/shared';
import {
  FullScreenVignette,
  PLAYER_SMOKE_PARTICLES,
  RotatingGameTip,
  SmokeParticles,
} from '@clocktower/ui';
import { useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { QrScannerModal } from '../src/components/QrScannerModal';
import { useConnection } from '../src/hooks/useConnection';
import { useConnectionStore } from '../src/stores/connectionStore';
import { usePlayerStore } from '../src/stores/playerStore';
import { styles } from '../src/styles/index.styles';

export default function JoinScreen() {
  const tips = useMemo(() => getAllTipTexts('player'), []);
  const savedServerUrl = useConnectionStore((s) => s.serverUrl);
  const [serverIp, setServerIp] = useState(savedServerUrl ?? '');
  const savedPlayerName = usePlayerStore((s) => s.playerName);
  const [playerName, setPlayerName] = useState(savedPlayerName ?? '');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scannedRef = useRef(false);
  const router = useRouter();
  const { connect, joinGame, joinAsTraveller, rejoinGame } = useConnection();
  const [permission, requestPermission] = useCameraPermissions();

  // Title glow pulse
  const glowPulse = useSharedValue(0);
  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [glowPulse]);

  const titleGlowStyle = useAnimatedStyle(() => ({
    textShadowRadius: interpolate(glowPulse.value, [0, 1], [20, 40]),
    opacity: interpolate(glowPulse.value, [0, 1], [0.9, 1]),
  }));

  const dividerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.4, 0.8]),
  }));

  // 이전 세션 정보가 있으면 자동 재접속 시도
  useEffect(() => {
    const tryRejoin = async () => {
      const { serverUrl } = useConnectionStore.getState();
      const { playerId } = usePlayerStore.getState();
      if (!serverUrl || !playerId) return;

      setIsJoining(true);
      try {
        useConnectionStore.getState().set({ serverUrl });
        await connect();
        const success = await rejoinGame(playerId);
        if (success) {
          router.replace('/game');
          return;
        }
      } catch {
        // 재접속 실패 시 무시하고 수동 접속 화면 표시
      } finally {
        setIsJoining(false);
      }
    };
    tryRejoin();
  }, [connect, rejoinGame, router.replace]);

  const doConnect = async () => {
    const trimmedIp = serverIp.trim();
    if (!trimmedIp) {
      setError('서버 IP를 입력하세요');
      return null;
    }
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setError('이름을 입력하세요');
      return null;
    }
    setError('');
    const url = trimmedIp.startsWith('http')
      ? trimmedIp
      : `http://${trimmedIp}:3000`;
    useConnectionStore.getState().set({ serverUrl: url });
    await connect();
    return trimmedName;
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const trimmedName = await doConnect();
      if (!trimmedName) return;
      const result = await joinGame(trimmedName);
      if (!result.success) {
        setError(result.error ?? '게임에 참가할 수 없습니다.');
        return;
      }
      usePlayerStore.getState().set({ playerName: trimmedName });
      router.replace('/game');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '서버에 연결할 수 없습니다.',
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinAsTraveller = async () => {
    setIsJoining(true);
    try {
      const trimmedName = await doConnect();
      if (!trimmedName) return;
      const result = await joinAsTraveller(trimmedName);
      if (!result.success) {
        setError(result.error ?? '여행자로 참가할 수 없습니다.');
        return;
      }
      usePlayerStore.getState().set({ playerName: trimmedName });
      router.replace('/game');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '서버에 연결할 수 없습니다.',
      );
    } finally {
      setIsJoining(false);
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    scannedRef.current = false;
    setShowScanner(true);
  };

  const handleBarCodeScanned = (result: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setShowScanner(false);
    try {
      const parsed = JSON.parse(result.data);
      if (parsed.server) {
        setServerIp(parsed.server);
        useConnectionStore.getState().set({ serverUrl: parsed.server });
      }
    } catch {
      // JSON이 아니면 서버 URL로 직접 사용
      const trimmed = result.data.trim();
      if (trimmed) {
        setServerIp(trimmed);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Deep dark-crimson background gradient */}
      <LinearGradient
        colors={['#0a0506', '#120808', '#1a0a0a', '#0d0506', '#080304']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={styles.backgroundGradient}
      />

      {/* Atmospheric layers */}
      <SmokeParticles particles={PLAYER_SMOKE_PARTICLES} />
      <FullScreenVignette
        color="#0a0304"
        opacityRange={[0.6, 0.85]}
        duration={5000}
      />

      <QrScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleSubtext}>시계 탑에 흐른</Text>
          <Animated.Text style={[styles.titleText, titleGlowStyle]}>
            피
          </Animated.Text>
          <View style={styles.titleDivider}>
            <Animated.View style={dividerGlowStyle}>
              <LinearGradient
                colors={[
                  'transparent',
                  '#8b1a1a',
                  '#cc3333',
                  '#8b1a1a',
                  'transparent',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.titleDividerGradient}
              />
            </Animated.View>
          </View>
          <View style={styles.decorRow}>
            <Text style={styles.decorCross}>+</Text>
            <Text style={styles.decorCross}>+</Text>
            <Text style={styles.decorCross}>+</Text>
            <Text style={styles.decorCenter}>+</Text>
            <Text style={styles.decorCross}>+</Text>
            <Text style={styles.decorCross}>+</Text>
            <Text style={styles.decorCross}>+</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>서버 IP</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.ipInput]}
                placeholder="192.168.0.22"
                placeholderTextColor="#4a3030"
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
                  styles.scanButton,
                  pressed && styles.scanButtonPressed,
                ]}
                onPress={openScanner}
              >
                <Text style={styles.scanButtonText}>QR</Text>
              </Pressable>
            </View>
          </View>

          <View>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름 입력"
              placeholderTextColor="#4a3030"
              value={playerName}
              onChangeText={setPlayerName}
              autoCapitalize="words"
              maxLength={20}
              autoComplete="name"
              textContentType="name"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.joinButton,
              pressed && styles.joinButtonPressed,
            ]}
            onPress={handleJoin}
            disabled={isJoining}
          >
            <LinearGradient
              colors={['#6b1515', '#8b2020', '#6b1515']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.joinButtonGradient}
            />
            {isJoining ? (
              <ActivityIndicator color="#e0ddd8" />
            ) : (
              <Text style={styles.joinButtonText}>게임 참가</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.joinButton,
              { marginTop: 8 },
              pressed && styles.joinButtonPressed,
            ]}
            onPress={handleJoinAsTraveller}
            disabled={isJoining}
          >
            <LinearGradient
              colors={['#3a1a4a', '#5a2a6a', '#3a1a4a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.joinButtonGradient}
            />
            <Text style={styles.joinButtonText}>여행자로 참가</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          진행자 화면의 QR을 스캔하면 자동으로 입력됩니다
        </Text>

        <View style={styles.tipContainer}>
          <RotatingGameTip tips={tips} color="#8b5050" glowColor="#6b3030" />
        </View>
      </View>

      <Text style={styles.copyright}>
        Blood on the Clocktower © The Pandemonium Institute.{'\n'}App by DevGon
      </Text>
    </SafeAreaView>
  );
}
