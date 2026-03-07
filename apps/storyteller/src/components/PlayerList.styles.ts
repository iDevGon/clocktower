import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#1a1a1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e2e34',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 9999,
  },
  playerName: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: '500',
  },
  roleName: {
    color: '#908e8a',
    fontSize: 14,
  },
});
