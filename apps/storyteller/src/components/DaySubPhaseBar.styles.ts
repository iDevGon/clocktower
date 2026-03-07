import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  subPhaseBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1e',
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  subPhaseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#242428',
  },
  subPhaseButtonActive: {
    backgroundColor: '#302820',
    borderWidth: 1,
    borderColor: '#c4a050',
  },
  subPhaseLabel: {
    color: '#5c5a58',
    fontSize: 13,
    fontWeight: '600',
  },
  subPhaseLabelActive: {
    color: '#c4a050',
  },
});
