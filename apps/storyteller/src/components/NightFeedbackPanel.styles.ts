import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const panelStyles = StyleSheet.create({
  scrollViewFlex: {
    flex: 1,
  },
});

export const getContentPadding = (scale: number) => ({
  padding: scale * 12,
});

export const getAbilityTextStyle = (scale: number) => ({
  fontFamily: typography.family.body,
  fontSize: scale * 11,
  lineHeight: scale * 17,
  color: colors.parchment.mid,
  marginTop: scale * 4,
  marginBottom: scale * 4,
});
