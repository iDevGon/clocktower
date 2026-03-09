import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  token: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 2,
  },
  name: {
    color: '#e0ddd8',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  role: {
    color: '#908e8a',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  dead: {
    color: '#b85c5c',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    marginTop: 2,
    position: 'absolute',
    bottom: -8,
  },
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
});
