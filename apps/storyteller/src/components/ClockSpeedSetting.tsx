import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  Keyboard,
  type LayoutChangeEvent,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createClockSpeedSettingStyles } from './ClockSpeedSetting.styles';
import {
  createDurationDraft,
  formatDurationOption,
  getDurationDraftStatus,
  reduceDurationDraft,
} from './durationInput';

export function ClockSpeedSetting({
  value,
  onChange,
  scale,
  label = '투표 시간',
  showOff = false,
  options = [30, 45, 60, 90, 120],
  formatOption,
  onInteractionStart,
  onInteractionEnd,
}: {
  value: number;
  onChange: (val: number) => void;
  scale: number;
  label?: string;
  showOff?: boolean;
  options?: number[];
  formatOption?: (val: number) => string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}) {
  const st = useMemo(
    () => createClockSpeedSettingStyles((v: number) => Math.round(v * scale)),
    [scale],
  );
  const fmt = formatOption ?? formatDurationOption;
  const [durationDraft, setDurationDraft] = useState(() =>
    createDurationDraft(value),
  );
  const durationDraftRef = useRef(durationDraft);

  useEffect(() => {
    const next = reduceDurationDraft(durationDraftRef.current, {
      type: 'sync',
      value,
    });
    durationDraftRef.current = next;
    setDurationDraft(next);
  }, [value]);

  const startInteraction = useCallback(
    () => onInteractionStart?.(),
    [onInteractionStart],
  );
  const endInteraction = useCallback(
    () => onInteractionEnd?.(),
    [onInteractionEnd],
  );

  const updateDurationDraft = useCallback(
    (action: Parameters<typeof reduceDurationDraft>[1]) => {
      const next = reduceDurationDraft(durationDraftRef.current, action);
      durationDraftRef.current = next;
      setDurationDraft(next);
      return next;
    },
    [],
  );

  const durationStatus = getDurationDraftStatus(durationDraft, value);

  const applyDurationDraft = useCallback(() => {
    const status = getDurationDraftStatus(durationDraftRef.current, value);
    if (!status.canApply || status.totalSeconds === null) return;

    updateDurationDraft({ type: 'apply' });
    Keyboard.dismiss();
    onChange(status.totalSeconds);
  }, [onChange, updateDurationDraft, value]);

  const resetDurationDraft = useCallback(() => {
    updateDurationDraft({ type: 'reset', value });
  }, [updateDurationDraft, value]);

  const selectPreset = useCallback(
    (preset: number) => {
      updateDurationDraft({ type: 'preset', value: preset });
      onChange(preset);
    },
    [onChange, updateDurationDraft],
  );

  const steps = useMemo(
    () => (showOff ? [...options, 0] : options),
    [showOff, options],
  );

  const currentIndex = useMemo(() => {
    const idx = steps.indexOf(value);
    if (idx >= 0) return idx;
    let closest = 0;
    let minDiff = Math.abs(steps[0] - value);
    for (let i = 1; i < steps.length; i++) {
      const diff = Math.abs(steps[i] - value);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    return closest;
  }, [steps, value]);

  const isOff = value === 0;
  const displayText = isOff ? '무제한' : fmt(value);

  const fillPct =
    steps.length <= 1 ? 0 : ((currentIndex + 0.5) / steps.length) * 100;
  const trackStartPct = (0.5 / steps.length) * 100;

  // 드래그 지원: locationX → 스텝 인덱스
  const rowWidth = useRef(0);

  const onRowLayout = useCallback((e: LayoutChangeEvent) => {
    rowWidth.current = e.nativeEvent.layout.width;
  }, []);

  const resolveFromTouch = useCallback(
    (e: GestureResponderEvent) => {
      const x = e.nativeEvent.locationX;
      const w = rowWidth.current;
      if (w <= 0) return;
      const idx = Math.round((x / w) * (steps.length - 1));
      const clamped = Math.max(0, Math.min(steps.length - 1, idx));
      selectPreset(steps[clamped]);
    },
    [steps, selectPreset],
  );

  return (
    <View style={st.container}>
      <View style={st.labelRow}>
        <Text style={st.label}>{label}</Text>
        <Text style={[st.valueText, isOff && st.valueTextOff]}>
          {displayText}
        </Text>
      </View>

      {/* 셀 그리드: 트랙(absolute) + 눈금 + thumb + 라벨 */}
      <View
        style={st.cellRow}
        onLayout={onRowLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          onInteractionStart?.();
          resolveFromTouch(event);
        }}
        onResponderMove={resolveFromTouch}
        onResponderRelease={() => onInteractionEnd?.()}
        onResponderTerminate={() => onInteractionEnd?.()}
      >
        {/* 트랙 (셀 중앙 ~ 셀 중앙, absolute) */}
        <View style={st.trackWrapper}>
          <View
            style={[
              st.trackBg,
              { left: `${trackStartPct}%`, right: `${trackStartPct}%` },
            ]}
          />
          <View
            style={[
              st.trackFill,
              {
                left: `${trackStartPct}%`,
                width: `${Math.max(0, fillPct - trackStartPct)}%`,
                backgroundColor: isOff ? '#6a3a3a' : '#4a6a9c',
              },
            ]}
          />
        </View>
        {steps.map((step, i) => {
          const active = i === currentIndex;
          const off = step === 0;
          return (
            <Pressable
              key={step}
              style={st.cell}
              onPress={() => selectPreset(step)}
            >
              {active ? (
                <View
                  style={[
                    st.thumb,
                    { backgroundColor: off ? '#e08080' : '#8ab4f8' },
                  ]}
                />
              ) : (
                <View style={st.tickMark} />
              )}
              <Text
                style={[
                  st.tickLabel,
                  active && (off ? st.tickLabelOff : st.tickLabelActive),
                ]}
                numberOfLines={1}
              >
                {off ? '무제한' : fmt(step)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={st.durationInputRow}>
        <View style={st.durationInputGroup}>
          <TextInput
            accessibilityLabel={`${label} 분`}
            keyboardType="numeric"
            onBlur={endInteraction}
            onChangeText={(nextValue) =>
              updateDurationDraft({
                type: 'edit',
                part: 'minutes',
                value: nextValue,
              })
            }
            onFocus={startInteraction}
            style={st.durationInput}
            value={durationDraft.parts.minutes}
          />
          <Text style={st.durationInputLabel}>분</Text>
        </View>
        <View style={st.durationInputGroup}>
          <TextInput
            accessibilityLabel={`${label} 초`}
            keyboardType="numeric"
            onBlur={endInteraction}
            onChangeText={(nextValue) =>
              updateDurationDraft({
                type: 'edit',
                part: 'seconds',
                value: nextValue,
              })
            }
            onFocus={startInteraction}
            style={st.durationInput}
            value={durationDraft.parts.seconds}
          />
          <Text style={st.durationInputLabel}>초</Text>
        </View>
      </View>

      {durationStatus.error && (
        <Text accessibilityLiveRegion="polite" style={st.durationInputError}>
          {durationStatus.error}
        </Text>
      )}
      <View style={st.durationActions}>
        {durationDraft.isDirty && (
          <Pressable
            accessibilityLabel={`${label} 입력 되돌리기`}
            onPress={resetDurationDraft}
            style={st.durationResetButton}
          >
            <Text style={st.durationResetText}>되돌리기</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel={`${label} 시간 적용`}
          accessibilityState={{ disabled: !durationStatus.canApply }}
          disabled={!durationStatus.canApply}
          onPress={applyDurationDraft}
          style={[
            st.durationApplyButton,
            !durationStatus.canApply && st.durationApplyButtonDisabled,
          ]}
        >
          <Text
            style={[
              st.durationApplyText,
              !durationStatus.canApply && st.durationApplyTextDisabled,
            ]}
          >
            적용
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
