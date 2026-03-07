import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  instruction: {
    color: '#908e8a',
    fontSize: 14,
    marginBottom: 4,
  },
  selectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  selectionBox: {
    flex: 1,
    backgroundColor: '#1a1a1e',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2e2e34',
  },
  selectionLabel: {
    color: '#5c5a58',
    fontSize: 12,
    marginBottom: 4,
  },
  selectionValue: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#2e2e34',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#943c3c',
  },
  submitButtonPressed: {
    backgroundColor: '#7a3030',
  },
  submitButtonDisabled: {
    backgroundColor: '#242428',
  },
  submitButtonText: {
    color: '#e0ddd8',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
