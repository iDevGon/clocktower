import {
  Image,
  type ImageSourcePropType,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

export interface SpriteIconProps {
  source: ImageSourcePropType;
  index: number;
  size: number;
  columns?: number;
  tileSize?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

export function SpriteIcon({
  source,
  index,
  size,
  columns = 4,
  tileSize = 256,
  opacity = 1,
  style,
}: SpriteIconProps) {
  const safeColumns = Math.max(1, columns);
  const row = Math.floor(index / safeColumns);
  const col = index % safeColumns;
  const scale = size / tileSize;
  const spriteSize = tileSize * safeColumns * scale;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: Math.max(4, Math.round(size * 0.18)),
        },
        style,
      ]}
    >
      <Image
        source={source}
        resizeMode="stretch"
        style={[
          styles.image,
          {
            width: spriteSize,
            height: spriteSize,
            left: -col * tileSize * scale,
            top: -row * tileSize * scale,
            opacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
});
