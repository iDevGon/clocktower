import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13,7,3,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  container: {
    width: '100%',
    maxWidth: 560,
    flex: 1,
    backgroundColor: colors.arcane.surface.apparatus,
    borderRadius: 8,
    marginVertical: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.arcane.border.brassDim,
  },
  title: {
    color: colors.arcane.text.strong,
    fontSize: 18,
    fontFamily: typography.fontFamily.display,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.arcane.surface.ledger,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
  },
  closeText: {
    color: colors.arcane.text.label,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.arcane.text.dead,
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  entry: {
    gap: 8,
  },
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayLabelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.arcane.accent.sapphireLens,
  },
  dayLabel: {
    color: colors.arcane.accent.sapphireLens,
    fontSize: 13,
    fontFamily: typography.fontFamily.bodyBold,
  },
  feedbackWrapper: {
    marginLeft: 16,
  },
});
