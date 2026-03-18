import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 10,
  },
  openingLabel: {
    color: '#804a4a',
    fontSize: 13,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  openingTitle: {
    color: '#c08080',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  openingDivider: {
    width: 60,
    height: 1,
    backgroundColor: '#602a2a',
    marginBottom: 28,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    backgroundColor: '#14141a',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 22,
    width: '100%',
    overflow: 'hidden',
  },
  teamLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 6,
  },
  roleName: {
    color: '#eae8e4',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 14,
    letterSpacing: 1,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#2a2a34',
    marginBottom: 14,
  },
  ability: {
    color: '#b8b6b2',
    fontSize: 14,
    lineHeight: 21,
  },
  dismissHint: {
    color: '#3a2020',
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 24,
  },
});
