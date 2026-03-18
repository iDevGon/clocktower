import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  skullText: {
    fontSize: 64,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    letterSpacing: 12,
    color: '#8b0000',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#cc2020',
    textAlign: 'center',
    marginBottom: 8,
  },
  reasonBadge: {
    backgroundColor: 'rgba(139, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#a04040',
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7a2020',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleEmphasis: {
    color: '#ff4040',
    fontWeight: '800',
    fontSize: 16,
  },
  subtitleHint: {
    fontSize: 13,
    color: '#5a1818',
    fontWeight: '300',
    textAlign: 'center',
  },
});
