import { Image, StyleSheet, View } from 'react-native';
import { voteClockFace } from '../assets/ui';
import {
  clockFaceBgStyle,
  clockFaceImageStyle,
  outerGlowStyle,
  styles,
} from './VoteClockFace.styles';

interface VoteClockFaceProps {
  centerX: number;
  centerY: number;
  radius: number;
}

export function VoteClockFace({
  centerX,
  centerY,
  radius,
}: VoteClockFaceProps) {
  const ringSize = radius * 2 + 20;

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      {/* Outer glow */}
      <View style={outerGlowStyle(centerX, centerY, ringSize)} />

      {/* Clock face background */}
      <View style={clockFaceBgStyle(centerX, centerY, ringSize)} />

      <Image
        source={voteClockFace}
        resizeMode="contain"
        style={clockFaceImageStyle(centerX, centerY, ringSize)}
      />
    </View>
  );
}
