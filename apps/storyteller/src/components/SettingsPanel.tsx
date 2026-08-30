import type { GameSettings } from '@clocktower/shared';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { ClockSpeedSetting } from './ClockSpeedSetting';
import { CollapsibleSection } from './CollapsibleSection';
import { formatDurationOption } from './durationInput';

const DISCUSSION_OPTIONS = [600, 1200, 1800];
const NOMINATION_OPTIONS = [300, 600, 900];

interface SettingsPanelProps {
  settings: GameSettings;
  onSettingsChange: (partial: Partial<GameSettings>) => void;
  onClose: () => void;
  scale: number;
  fontSize: { sm: number; md: number; lg: number };
  styles: ReturnType<
    typeof import('../styles/grimoire.styles').createGrimoireStyles
  >;
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  onClose,
  scale,
  fontSize,
  styles,
}: SettingsPanelProps) {
  const [timerOpen, setTimerOpen] = useState(false);
  const lowPowerMode = useSettingsStore((s) => s.lowPowerMode);
  const setLowPowerMode = useSettingsStore((s) => s.setLowPowerMode);

  return (
    <KeyboardAvoidingView
      style={styles.settingsOverlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.settingsPanel}>
        <ScrollView
          style={styles.settingsScrollView}
          contentContainerStyle={styles.settingsScrollContent}
          keyboardShouldPersistTaps="handled"
          accessibilityLabel="게임 설정"
        >
          <Text style={[styles.settingsTitle, { fontSize: fontSize.lg }]}>
            게임 설정
          </Text>

          <View style={styles.settingsRow}>
            <View>
              <Text style={[styles.settingsLabel, { fontSize: fontSize.md }]}>
                저전력 모드
              </Text>
              <Text style={[styles.settingsDesc, { fontSize: fontSize.sm }]}>
                {lowPowerMode
                  ? 'ON — 애니메이션 비활성화'
                  : 'OFF — 모든 효과 사용'}
              </Text>
            </View>
            <Switch
              value={lowPowerMode}
              onValueChange={setLowPowerMode}
              trackColor={{ false: '#3a3a42', true: '#2a4a2a' }}
              thumbColor={lowPowerMode ? '#2ecc71' : '#908e8a'}
              accessibilityLabel="저전력 모드"
            />
          </View>

          <View style={styles.settingsRow}>
            <View>
              <Text style={[styles.settingsLabel, { fontSize: fontSize.md }]}>
                채팅 밀담
              </Text>
              <Text style={[styles.settingsDesc, { fontSize: fontSize.sm }]}>
                {settings.whisperMode === 'chat'
                  ? 'ON — 앱 내 채팅'
                  : 'OFF — 직접 대면만'}
              </Text>
            </View>
            <Switch
              value={settings.whisperMode === 'chat'}
              onValueChange={(val) =>
                onSettingsChange({
                  whisperMode: val ? 'chat' : 'offline',
                })
              }
              trackColor={{ false: '#3a3a42', true: '#2a4a2a' }}
              thumbColor={
                settings.whisperMode === 'chat' ? '#2ecc71' : '#908e8a'
              }
              accessibilityLabel="채팅 밀담 모드"
            />
          </View>

          <View style={styles.settingsRow}>
            <View>
              <Text style={[styles.settingsLabel, { fontSize: fontSize.md }]}>
                온라인 투표
              </Text>
              <Text style={[styles.settingsDesc, { fontSize: fontSize.sm }]}>
                {settings.votingMode === 'online'
                  ? 'ON — 앱 내 투표'
                  : 'OFF — 직접 투표'}
              </Text>
            </View>
            <Switch
              value={settings.votingMode === 'online'}
              onValueChange={(val) =>
                onSettingsChange({
                  votingMode: val ? 'online' : 'offline',
                })
              }
              trackColor={{ false: '#3a3a42', true: '#2a4a2a' }}
              thumbColor={
                settings.votingMode === 'online' ? '#2ecc71' : '#908e8a'
              }
              accessibilityLabel="온라인 투표"
            />
          </View>

          <View style={styles.settingsRow}>
            <View>
              <Text style={[styles.settingsLabel, { fontSize: fontSize.md }]}>
                이전 투표 기록
              </Text>
            </View>
            <Switch
              value={settings.showVoteHistory}
              onValueChange={(val) =>
                onSettingsChange({ showVoteHistory: val })
              }
              trackColor={{ false: '#3a3a42', true: '#2a4a2a' }}
              thumbColor={settings.showVoteHistory ? '#2ecc71' : '#908e8a'}
              accessibilityLabel="이전 투표 기록"
            />
          </View>

          {settings.whisperMode === 'chat' && (
            <View style={styles.settingsClockMargin}>
              <ClockSpeedSetting
                value={settings.whisperClockSeconds}
                onChange={(val) =>
                  onSettingsChange({ whisperClockSeconds: val })
                }
                scale={scale}
                label="밀담 시간"
                showOff
                options={[30, 45, 60, 90, 120]}
                formatOption={formatDurationOption}
              />
            </View>
          )}

          {settings.votingMode === 'online' && (
            <View style={styles.settingsClockMargin}>
              <ClockSpeedSetting
                value={settings.voteClockSeconds}
                onChange={(val) => onSettingsChange({ voteClockSeconds: val })}
                scale={scale}
                label="투표 시간 (1인당)"
                options={[2, 3, 5, 7, 10]}
                formatOption={formatDurationOption}
              />
            </View>
          )}

          <CollapsibleSection
            label="타이머 설정"
            isOpen={timerOpen}
            onToggle={() => setTimerOpen((v) => !v)}
            scale={scale}
          >
            <View style={{ gap: 8 }}>
              <ClockSpeedSetting
                value={settings.discussionClockSeconds}
                onChange={(val) =>
                  onSettingsChange({ discussionClockSeconds: val })
                }
                scale={scale}
                label="공개토론 시간"
                showOff
                options={DISCUSSION_OPTIONS}
                formatOption={formatDurationOption}
              />
              <ClockSpeedSetting
                value={settings.nominationClockSeconds}
                onChange={(val) =>
                  onSettingsChange({ nominationClockSeconds: val })
                }
                scale={scale}
                label="지목 시간"
                showOff
                options={NOMINATION_OPTIONS}
                formatOption={formatDurationOption}
              />
              <ClockSpeedSetting
                value={settings.defenseClockSeconds}
                onChange={(val) =>
                  onSettingsChange({ defenseClockSeconds: val })
                }
                scale={scale}
                label="변론 시간"
                showOff
                options={NOMINATION_OPTIONS}
                formatOption={formatDurationOption}
              />
            </View>
          </CollapsibleSection>

          <Pressable onPress={onClose} style={styles.settingsCloseButton}>
            <Text style={[styles.settingsCloseText, { fontSize: fontSize.md }]}>
              닫기
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
