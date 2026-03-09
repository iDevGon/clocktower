import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { QrScannerModal } from '../src/components/QrScannerModal';
import { useConnection } from '../src/hooks/useConnection';
import { useConnectionStore } from '../src/stores/connectionStore';
import { usePlayerStore } from '../src/stores/playerStore';
import { styles } from '../src/styles/index.styles';

export default function JoinScreen() {
  const savedServerUrl = useConnectionStore((s) => s.serverUrl);
  const [serverIp, setServerIp] = useState(savedServerUrl ?? '');
  const savedPlayerName = usePlayerStore((s) => s.playerName);
  const [playerName, setPlayerName] = useState(savedPlayerName ?? '');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scannedRef = useRef(false);
  const router = useRouter();
  const { connect, joinGame, rejoinGame } = useConnection();
  const [permission, requestPermission] = useCameraPermissions();

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

  const handleJoin = async () => {
    const trimmedIp = serverIp.trim();
    const trimmedName = playerName.trim();

    if (!trimmedIp) {
      setError('서버 IP를 입력하세요');
      return;
    }
    if (!trimmedName) {
      setError('이름을 입력하세요');
      return;
    }

    setError('');
    setIsJoining(true);

    const url = trimmedIp.startsWith('http')
      ? trimmedIp
      : `http://${trimmedIp}:3000`;
    useConnectionStore.getState().set({ serverUrl: url });

    try {
      await connect();
      const result = await joinGame(trimmedName);
      if (result.success) {
        usePlayerStore.getState().set({ playerName: trimmedName });
        router.replace('/game');
      } else {
        setError(result.error ?? '게임에 참가할 수 없습니다.');
      }
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
    <View style={styles.container}>
      <StatusBar style="light" />

      <QrScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcodeScanned={handleBarCodeScanned}
      />

      <View style={styles.titleContainer}>
        <Text style={styles.titleSubtext}>시계 탑에 흐른</Text>
        <Text style={styles.titleText}>피</Text>
        <View style={styles.titleDivider} />
      </View>

      <View style={styles.form}>
        <View>
          <Text style={styles.label}>서버 IP</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.ipInput]}
              placeholder="192.168.0.22"
              placeholderTextColor="#5c5a58"
              value={serverIp}
              onChangeText={setServerIp}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
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
            placeholderTextColor="#5c5a58"
            value={playerName}
            onChangeText={setPlayerName}
            autoCapitalize="words"
            maxLength={20}
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
          {isJoining ? (
            <ActivityIndicator color="#e0ddd8" />
          ) : (
            <Text style={styles.joinButtonText}>게임 참가</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        진행자 화면의 QR을 스캔하면 자동으로 입력됩니다
      </Text>
    </View>
  );
}
