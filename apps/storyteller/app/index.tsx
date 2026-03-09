import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { QRScannerModal } from '../src/components/QRScannerModal';
import { useGameActions } from '../src/hooks/useGameActions';
import { useResponsive } from '../src/hooks/useResponsive';
import { useSocketConnection } from '../src/hooks/useSocketConnection';
import { useConnectionStore } from '../src/stores/connectionStore';
import { useGameStore } from '../src/stores/gameStore';
import { createIndexStyles } from '../src/styles/index.styles';

export default function HomeScreen() {
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
  const gameState = useGameStore((s) => s.gameState);
  const [permission, requestPermission] = useCameraPermissions();

  const navigateToGame = useCallback(() => {
    const state = useGameStore.getState().gameState;
    if (!state?.id) return;
    if (!state.started) {
      router.replace('/game/lobby');
    } else {
      router.replace('/game/grimoire');
    }
  }, [router]);

  useEffect(() => {
    if (!gameState?.id) return;

    // gameState가 있지만 소켓이 없으면 재연결 시도
    const { socket: existingSocket, serverUrl } = useConnectionStore.getState();
    if (!existingSocket?.connected && serverUrl) {
      connect(serverUrl)
        .then(() => {
          navigateToGame();
        })
        .catch(() => {
          // 재연결 실패 시 상태 초기화
          useGameStore.getState().reset();
        });
    } else {
      navigateToGame();
    }
  }, [gameState?.id, connect, navigateToGame]);

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
    // IP 표시용으로 추출
    try {
      const { host } = new URL(url);
      setServerIp(host);
    } catch {
      setServerIp(trimmed);
    }
    connectAndCreate(url);
  };

  return (
    <View style={styles.container}>
      <QRScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleBarCodeScanned}
      />

      <Text style={styles.title}>시계 탑에 흐른</Text>
      <Text style={styles.subtitle}>피</Text>

      <Text style={styles.label}>진행자</Text>

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="서버 IP (예: 192.168.0.22)"
            placeholderTextColor="#5c5a58"
            value={serverIp}
            onChangeText={setServerIp}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
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
          {isConnecting ? (
            <ActivityIndicator color="#e0ddd8" />
          ) : (
            <Text style={styles.buttonText}>게임 생성</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
