import { Pressable, Text, View } from 'react-native';
import {
  createClockSpeedSettingStyles,
  optionButtonStyle,
  optionTextStyle,
} from './ClockSpeedSetting.styles';

export function ClockSpeedSetting({
  value,
  onChange,
  scale,
  label = '투표 시간',
  showOff = false,
  options = [30, 45, 60, 90, 120],
  formatOption,
}: {
  value: number;
  onChange: (val: number) => void;
  scale: number;
  label?: string;
  showOff?: boolean;
  options?: number[];
  formatOption?: (val: number) => string;
}) {
  const s = (v: number) => Math.round(v * scale);
  const st = createClockSpeedSettingStyles(s);
  const defaultFormat = (sec: number) => `${sec}초`;
  const fmt = formatOption ?? defaultFormat;

  return (
    <View style={st.container}>
      <Text style={st.label}>{label}</Text>
      <View style={st.options}>
        {showOff && (
          <Pressable
            onPress={() => onChange(0)}
            style={optionButtonStyle(s, value === 0, true)}
            accessibilityLabel={`${label} 없음`}
            accessibilityRole="button"
          >
            <Text style={optionTextStyle(s, value === 0, true)}>없음</Text>
          </Pressable>
        )}
        {options.map((sec) => (
          <Pressable
            key={sec}
            onPress={() => onChange(sec)}
            style={optionButtonStyle(s, value === sec)}
            accessibilityLabel={`${label} ${fmt(sec)}`}
            accessibilityRole="button"
          >
            <Text style={optionTextStyle(s, value === sec)}>{fmt(sec)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
