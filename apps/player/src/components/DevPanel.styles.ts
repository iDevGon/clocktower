import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  devPanel: {
    borderTopWidth: 1,
    borderColor: '#3a3a40',
    paddingTop: 12,
  },
  devToggle: {
    backgroundColor: '#3a3a40',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  devToggleText: {
    color: '#908e8a',
    fontSize: 12,
    fontWeight: '600',
  },
  devSection: {
    marginTop: 12,
  },
  devSectionTitle: {
    color: '#706e6a',
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  devRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  devRoleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  devChip: {
    backgroundColor: '#1a1a1e',
    borderWidth: 1,
    borderColor: '#2e2e34',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  devChipActive: {
    borderColor: '#8090c0',
    backgroundColor: '#1e2038',
  },
  devChipText: {
    color: '#706e6a',
    fontSize: 12,
  },
  devChipTextActive: {
    color: '#8090c0',
    fontWeight: 'bold',
  },
});
