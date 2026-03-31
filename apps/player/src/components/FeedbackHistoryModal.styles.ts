import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  title: {
    color: '#e0ddd8',
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a30',
  },
  closeText: {
    color: '#908e8a',
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#5c5a58',
    fontSize: 14,
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
    backgroundColor: '#8090c0',
  },
  dayLabel: {
    color: '#8090c0',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackWrapper: {
    marginLeft: 16,
  },
  entryHighlight: {
    backgroundColor: 'rgba(128, 144, 192, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 144, 192, 0.4)',
    padding: 8,
    marginHorizontal: -8,
  },
});
