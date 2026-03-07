import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  roleItem: {
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#1a1a1e',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  roleItemPressed: {
    backgroundColor: '#242428',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roleName: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  abilityText: {
    color: '#908e8a',
    fontSize: 14,
    lineHeight: 20,
  },
});
