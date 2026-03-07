import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#2e2e34',
    backgroundColor: '#161618',
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    color: '#8090c0',
    fontSize: 13,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#1e2038',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a52',
  },
  nextText: {
    color: '#8090c0',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 12,
    gap: 6,
  },
  roleItem: {
    backgroundColor: '#1a1a1e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2e2e34',
  },
  roleItemActive: {
    backgroundColor: '#1e2038',
    borderColor: '#8090c0',
  },
  roleItemPast: {
    opacity: 0.4,
  },
  roleName: {
    color: '#908e8a',
    fontSize: 12,
    fontWeight: '500',
  },
  roleNameActive: {
    color: '#8090c0',
  },
  roleNamePast: {
    color: '#5c5a58',
  },
  roleItemAbsent: {
    borderStyle: 'dashed',
    opacity: 0.35,
  },
  roleNameAbsent: {
    color: '#5c5a58',
  },
});
