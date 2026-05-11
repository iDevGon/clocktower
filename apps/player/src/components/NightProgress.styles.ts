import { colors } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    overflow: 'hidden' as const,
  },
  myTurnBanner: {
    backgroundColor: '#1e2038',
    borderWidth: 1,
    borderColor: '#8090c0',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 24,
  },
  myTurnText: {
    color: '#8090c0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  dotContainer: {
    width: 14,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3a3a42',
  },
  dotPast: {
    backgroundColor: '#5c5a58',
  },
  dotActive: {
    backgroundColor: '#8090c0',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotMine: {
    backgroundColor: '#6a5a30',
    borderWidth: 1,
    borderColor: colors.phase.day,
  },
  dotMyActive: {
    backgroundColor: colors.phase.day,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#2e2e34',
  },
  lineHidden: {
    backgroundColor: 'transparent',
  },
  linePast: {
    backgroundColor: '#5c5a58',
  },
  roleName: {
    color: '#3a3a42',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
  roleNamePast: {
    color: '#5c5a58',
  },
  roleNameActive: {
    color: '#8090c0',
    fontWeight: 'bold',
  },
  roleNameMine: {
    color: colors.phase.day,
    fontWeight: '600',
  },
});
