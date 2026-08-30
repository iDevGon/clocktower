import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createClockSpeedSettingStyles } from './ClockSpeedSetting.styles';
import {
  applyDurationPartEdit,
  canonicalizeDurationParts,
  formatDurationOption,
  splitDurationSeconds,
  syncDurationParts,
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
  const [durationParts, setDurationParts] = useState(() =>
    splitDurationSeconds(value),
  );
  const durationPartsRef = useRef(durationParts);
  const focusedPartRef = useRef<keyof typeof durationParts | null>(null);

  useEffect(() => {
    const parts = syncDurationParts(
      value,
      durationPartsRef.current,
      focusedPartRef.current !== null,
    );
    durationPartsRef.current = parts;
    setDurationParts(parts);
  }, [value]);

  const startInteraction = useCallback(
    () => onInteractionStart?.(),
    [onInteractionStart],
  );
  const endInteraction = useCallback(
    () => onInteractionEnd?.(),
    [onInteractionEnd],
  );

  const changeDurationPart = useCallback(
    (part: keyof typeof durationParts, nextValue: string) => {
      const edit = applyDurationPartEdit(
        durationPartsRef.current,
        part,
        nextValue,
      );
      durationPartsRef.current = edit.parts;
      setDurationParts(edit.parts);
      if (edit.totalSeconds !== null) onChange(edit.totalSeconds);
    },
    [onChange],
  );

  const beginDurationEditing = useCallback(
    (part: keyof typeof durationParts) => {
      focusedPartRef.current = part;
      startInteraction();
    },
    [startInteraction],
  );

  const endDurationEditing = useCallback(
    (part: keyof typeof durationParts) => {
      if (focusedPartRef.current === part) {
        const parts = canonicalizeDurationParts(durationPartsRef.current);
        durationPartsRef.current = parts;
        setDurationParts(parts);
        focusedPartRef.current = null;
      }
      endInteraction();
    },
    [endInteraction],
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
      onChange(steps[clamped]);
    },
    [steps, onChange],
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
              onPress={() => onChange(step)}
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
            onBlur={() => endDurationEditing('minutes')}
            onChangeText={(nextValue) =>
              changeDurationPart('minutes', nextValue)
            }
            onFocus={() => beginDurationEditing('minutes')}
            style={st.durationInput}
            value={durationParts.minutes}
          />
          <Text style={st.durationInputLabel}>분</Text>
        </View>
        <View style={st.durationInputGroup}>
          <TextInput
            accessibilityLabel={`${label} 초`}
            keyboardType="numeric"
            onBlur={() => endDurationEditing('seconds')}
            onChangeText={(nextValue) =>
              changeDurationPart('seconds', nextValue)
            }
            onFocus={() => beginDurationEditing('seconds')}
            style={st.durationInput}
            value={durationParts.seconds}
          />
          <Text style={st.durationInputLabel}>초</Text>
        </View>
      </View>
    </View>
  );
}
