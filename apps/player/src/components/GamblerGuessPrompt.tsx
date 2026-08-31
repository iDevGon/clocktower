import type { GamblerGuessStatus, PlayerInfo, Role } from '@clocktower/shared';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { styles } from './GamblerGuessPrompt.styles';
import {
  canSubmitGamblerGuess,
  getGamblerGuessPresentation,
} from './gamblerGuessPresentation';

interface GamblerGuessPromptProps {
  players: PlayerInfo[];
  roles: Role[];
  status: GamblerGuessStatus;
  onSubmit: (
    targetPlayerId: string,
    guessedRoleId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

type Picker = 'player' | 'role' | null;

export function GamblerGuessPrompt({
  players,
  roles,
  status,
  onSubmit,
}: GamblerGuessPromptProps) {
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);
  const [guessedRoleId, setGuessedRoleId] = useState<string | null>(null);
  const [picker, setPicker] = useState<Picker>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const { canEdit, message } = getGamblerGuessPresentation(status);
  const canSubmit = canSubmitGamblerGuess({
    targetPlayerId,
    guessedRoleId,
    canEdit,
    isSubmitting,
  });
  const selectedPlayer = players.find((player) => player.id === targetPlayerId);
  const selectedRole = roles.find((role) => role.id === guessedRoleId);
  const pickerOptions = picker === 'player' ? players : roles;

  const handleSubmit = async () => {
    if (
      !canSubmit ||
      !targetPlayerId ||
      !guessedRoleId ||
      submittingRef.current
    ) {
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit(targetPlayerId, guessedRoleId);
      if (!result.success) {
        setError(result.error ?? '추측을 제출할 수 없습니다');
      }
    } catch {
      setError('추측을 제출할 수 없습니다');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>도박사</Text>
      <Text style={styles.instruction}>
        플레이어와 그 플레이어의 역할을 추측하세요
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="추측 대상 선택"
        accessibilityState={{ disabled: !canEdit }}
        disabled={!canEdit}
        onPress={() => setPicker('player')}
        style={[styles.selector, !canEdit && styles.selectorDisabled]}
      >
        <Text style={styles.selectorLabel}>플레이어</Text>
        <Text
          style={[
            styles.selectorValue,
            !selectedPlayer && styles.selectorPlaceholder,
          ]}
        >
          {selectedPlayer?.name ?? '선택하세요'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="추측 역할 선택"
        accessibilityState={{ disabled: !canEdit }}
        disabled={!canEdit}
        onPress={() => setPicker('role')}
        style={[styles.selector, !canEdit && styles.selectorDisabled]}
      >
        <Text style={styles.selectorLabel}>역할</Text>
        <Text
          style={[
            styles.selectorValue,
            !selectedRole && styles.selectorPlaceholder,
          ]}
        >
          {selectedRole?.name ?? '선택하세요'}
        </Text>
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="도박사 추측 제출"
        accessibilityState={{ disabled: !canSubmit }}
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
      >
        <Text
          style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}
        >
          {isSubmitting ? '제출 중…' : '제출'}
        </Text>
      </Pressable>

      <Modal
        visible={picker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <View accessibilityViewIsModal style={styles.overlay}>
          <View style={styles.pickerPanel}>
            <Text style={styles.pickerTitle}>
              {picker === 'player' ? '플레이어 선택' : '역할 선택'}
            </Text>
            <ScrollView
              style={styles.pickerScroll}
              contentContainerStyle={styles.pickerContent}
              nestedScrollEnabled
            >
              {pickerOptions.map((option) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={option.name}
                  key={option.id}
                  onPress={() => {
                    if (picker === 'player') {
                      setTargetPlayerId(option.id);
                    } else {
                      setGuessedRoleId(option.id);
                    }
                    setPicker(null);
                    setError(null);
                  }}
                  style={styles.pickerRow}
                >
                  <Text style={styles.pickerRowText}>{option.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="선택 창 닫기"
              onPress={() => setPicker(null)}
              style={styles.pickerClose}
            >
              <Text style={styles.pickerCloseText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
