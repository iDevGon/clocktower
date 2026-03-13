import { Switch, Text, View } from 'react-native';

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
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Math.round(8 * scale),
      }}
    >
      <Text
        style={{
          color: value ? '#e0ddd8' : '#5c5a58',
          fontSize: Math.round(12 * scale),
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3a3a42', true: '#2a4a2a' }}
        thumbColor={value ? '#2ecc71' : '#908e8a'}
      />
    </View>
  );
}
