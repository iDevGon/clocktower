import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  roleName: {
    color: '#8090c0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instruction: {
    color: '#908e8a',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  playerList: {
    width: '100%',
    gap: 8,
  },
  playerItem: {
    backgroundColor: '#1a1a1e',
    borderWidth: 1,
    borderColor: '#2e2e34',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  playerItemSelected: {
    backgroundColor: '#1e2038',
    borderColor: '#8090c0',
  },
  playerName: {
    color: '#908e8a',
    fontSize: 16,
  },
  playerNameSelected: {
    color: '#8090c0',
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#1e2038',
    borderWidth: 1,
    borderColor: '#8090c0',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  submitButtonDisabled: {
    backgroundColor: '#1a1a1e',
    borderColor: '#2e2e34',
  },
  submitText: {
    color: '#8090c0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitTextDisabled: {
    color: '#3a3a42',
  },
  // Done / Passive
  doneBanner: {
    backgroundColor: '#1a2618',
    borderWidth: 1,
    borderColor: '#4a7a3a',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneText: {
    color: '#6ab04c',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneSubtext: {
    color: '#5c7a4a',
    fontSize: 13,
    marginTop: 4,
  },
  passiveBanner: {
    backgroundColor: '#1e2038',
    borderWidth: 1,
    borderColor: '#3a3a52',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  passiveText: {
    color: '#8090c0',
    fontSize: 15,
    textAlign: 'center',
  },
});
