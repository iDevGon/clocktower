import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#121214',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  title: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: '600',
  },
  closeText: {
    color: '#908e8a',
    fontSize: 15,
  },
  headerSpacer: {
    width: 40,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1e',
    borderRadius: 12,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#2e2e34',
  },
  playerItemPressed: {
    backgroundColor: '#2e2e34',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a2020',
    borderWidth: 1,
    borderColor: '#943c3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    color: '#c47070',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerName: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: '500',
  },
  playerItemDisabled: {
    opacity: 0.45,
  },
  playerAvatarDisabled: {
    backgroundColor: '#2a2a2e',
    borderColor: '#3a3a3e',
  },
  playerAvatarTextDisabled: {
    color: '#5c5a58',
  },
  playerNameDisabled: {
    color: '#5c5a58',
  },
  alreadyNominatedHint: {
    color: '#706e6a',
    fontSize: 12,
    marginLeft: 'auto',
  },
});
