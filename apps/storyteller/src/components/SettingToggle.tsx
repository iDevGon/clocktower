import { Switch, Text, View } from 'react-native';
import { createSettingToggleStyles, labelStyle } from './SettingToggle.styles';

export function SettingToggle({
  label,
  value,
  onValueChange,
  scale,
}: {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  scale: number;
}) {
  const s = (v: number) => Math.round(v * scale);
  const st = createSettingToggleStyles(s);
  return (
    <View style={st.container}>
      <Text style={labelStyle(s, value)}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3a3a42', true: '#2a4a2a' }}
        thumbColor={value ? '#2ecc71' : '#908e8a'}
        accessibilityLabel={label}
      />
    </View>
  );
}
