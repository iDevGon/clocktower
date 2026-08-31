import { StyleSheet } from 'react-native';

export const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 5, 10, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    overflow: 'hidden',
    backgroundColor: '#111522',
    borderWidth: 2,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#323847',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  target: {
    color: '#e0ddd8',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  collapseButton: {
    minWidth: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242936',
    borderWidth: 1,
    borderColor: '#555c6c',
    borderRadius: 3,
    paddingHorizontal: 14,
  },
  collapseText: {
    color: '#f0ede8',
    fontSize: 15,
    fontWeight: '800',
  },
  scrollView: {
    flexShrink: 1,
  },
  content: {
    gap: 12,
    padding: 20,
  },
  recommendation: {
    backgroundColor: '#1d2130',
    borderWidth: 1,
    borderColor: '#716955',
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recommendationTitle: {
    color: '#ddd2b5',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  recommendationBody: {
    color: '#b7b3aa',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  sendingStatus: {
    color: '#ddd2b5',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 10,
  },
});

export const getAbilityTextStyle = (scale: number) => ({
  fontSize: scale * 11,
  lineHeight: scale * 17,
  color: '#a0a0a8',
  marginTop: scale * 4,
  marginBottom: scale * 4,
});
