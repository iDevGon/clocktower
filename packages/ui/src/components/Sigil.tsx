import {
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, typography } from '../tokens';

export type SigilTeam =
  | 'townsfolk'
  | 'outsider'
  | 'minion'
  | 'demon'
  | 'traveller'
  | 'unknown';

interface SigilProps {
  /** 역할명 한글 — 내부에 한 글자 표시 (첫 글자) */
  roleName?: string;
  /** 미리 지정한 한 글자 — 없으면 roleName 첫 글자 사용 */
  mark?: string;
  team?: SigilTeam;
  size?: number;
  /** 비활성 상태 — 사망·드렁크 등 */
  dimmed?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TEAM_ACCENT: Record<
  SigilTeam,
  { bg: string; border: string; fg: string }
> = {
  townsfolk: {
    bg: colors.twilight.deep,
    border: colors.twilight.core,
    fg: colors.twilight.glow,
  },
  outsider: {
    bg: colors.verdure.deep,
    border: colors.verdure.core,
    fg: colors.verdure.glow,
  },
  minion: {
    bg: colors.ember.deep,
    border: colors.ember.core,
    fg: colors.ember.glow,
  },
  demon: {
    bg: colors.crimson.deep,
    border: colors.crimson.core,
    fg: colors.crimson.glow,
  },
  traveller: {
    bg: colors.bruise.deep,
    border: colors.bruise.core,
    fg: colors.bruise.glow,
  },
  unknown: {
    bg: colors.ink.rise,
    border: colors.edge.gilt,
    fg: colors.parchment.mid,
  },
};

/**
 * 원형 역할 실링 — 플레이어 토큰의 내부 마크, 역할 공개 편지의 상단 실링.
 * 실제 역할 아트가 준비될 때까지 한글자 + 팀 색상으로 동작.
 */
export function Sigil({
  roleName,
  mark,
  team = 'unknown',
  size = 40,
  dimmed,
  style,
}: SigilProps) {
  const glyph = mark ?? roleName?.trim().slice(0, 1) ?? '?';
  const accent = TEAM_ACCENT[team];

  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: accent.bg,
          borderColor: accent.border,
          opacity: dimmed ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.mark,
          {
            color: accent.fg,
            fontSize: size * 0.46,
            lineHeight: size * 0.9,
          },
        ]}
        numberOfLines={1}
      >
        {glyph}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    fontFamily: typography.family.display,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
