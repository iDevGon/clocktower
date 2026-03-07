import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  qrContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  qrHint: {
    color: '#5c5a58',
    fontSize: 11,
    marginTop: 8,
  },
  codeLabel: {
    color: '#908e8a',
    fontSize: 14,
    marginBottom: 4,
  },
  codeValue: {
    color: '#e0ddd8',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 8,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  participantLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantLabel: {
    color: '#b8b6b2',
    fontSize: 18,
    fontWeight: '600',
  },
  devButton: {
    backgroundColor: '#3a3a40',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  devButtonText: {
    color: '#908e8a',
    fontSize: 11,
  },
  compositionHint: {
    color: '#706e6a',
    fontSize: 12,
  },
  distributeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  distributeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2a3a5c',
  },
  distributeButtonPressed: {
    backgroundColor: '#1e2e4a',
  },
  distributeButtonDisabled: {
    backgroundColor: '#242428',
  },
  distributeButtonText: {
    color: '#e0ddd8',
    fontSize: 15,
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
  startButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonActive: {
    backgroundColor: '#943c3c',
  },
  startButtonPressed: {
    backgroundColor: '#7a3030',
  },
  startButtonDisabled: {
    backgroundColor: '#242428',
  },
  startButtonText: {
    color: '#e0ddd8',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
