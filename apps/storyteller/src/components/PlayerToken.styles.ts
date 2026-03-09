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
  tooltipOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  tooltipBox: {
    backgroundColor: '#1e1e24',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxWidth: 280,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  tooltipDesc: {
    color: '#c0c0c8',
    fontSize: 13,
    lineHeight: 19,
  },
});
