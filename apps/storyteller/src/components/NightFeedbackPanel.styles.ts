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
  fontSize: scale * 11,
  lineHeight: scale * 17,
  color: '#a0a0a8',
  marginTop: scale * 4,
  marginBottom: scale * 4,
});
