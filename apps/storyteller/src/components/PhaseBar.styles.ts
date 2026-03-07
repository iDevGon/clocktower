import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#161618',
    borderTopWidth: 1,
    borderColor: '#2e2e34',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeButton: {
    borderWidth: 1,
    borderColor: '#3a3a42',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
