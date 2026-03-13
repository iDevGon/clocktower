import { Pressable, Text, View } from 'react-native';

export function ClockSpeedSetting({
  value,
  onChange,
  scale,
}: {
  value: number;
  onChange: (val: number) => void;
  scale: number;
}) {
  const s = (v: number) => Math.round(v * scale);
  const options = [30, 45, 60, 90, 120];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
      <Text style={{ color: '#908e8a', fontSize: s(12), fontWeight: '600' }}>
        투표시계
      </Text>
      {options.map((sec) => (
        <Pressable
          key={sec}
          onPress={() => onChange(sec)}
          style={{
            paddingVertical: s(4),
            paddingHorizontal: s(8),
            borderRadius: 4,
            backgroundColor: value === sec ? '#2a3a5c' : '#242428',
            borderWidth: 1,
            borderColor: value === sec ? '#4a6a9c' : '#3a3a3e',
          }}
        >
          <Text
            style={{
              color: value === sec ? '#8ab4f8' : '#706e6a',
              fontSize: s(11),
              fontWeight: '600',
            }}
          >
            {sec}초
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
