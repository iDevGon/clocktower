import type { Role, Team } from '@clocktower/shared';
import { StyleSheet, Text, View } from 'react-native';

const TEAM_STYLES: Record<
  Team,
  { borderColor: string; label: string; labelColor: string }
> = {
  townsfolk: {
    borderColor: '#506aaa',
    label: '마을주민',
    labelColor: '#7090c4',
  },
  outsider: { borderColor: '#3a8878', label: '외지인', labelColor: '#50a090' },
  minion: { borderColor: '#b87838', label: '하수인', labelColor: '#c48850' },
  demon: { borderColor: '#943c3c', label: '악마', labelColor: '#b85c5c' },
};

interface RoleCardProps {
  role: Role;
}

export function RoleCard({ role }: RoleCardProps) {
  const teamStyle = TEAM_STYLES[role.team];

  return (
    <View style={[styles.card, { borderColor: teamStyle.borderColor }]}>
      <Text style={[styles.teamLabel, { color: teamStyle.labelColor }]}>
        {teamStyle.label}
      </Text>
      <Text style={styles.roleName}>{role.name}</Text>
      <View style={styles.divider} />
      <Text style={styles.ability}>{role.ability}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1e',
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  teamLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  roleName: {
    color: '#e0ddd8',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#2e2e34',
    marginBottom: 12,
  },
  ability: {
    color: '#b8b6b2',
    fontSize: 14,
    lineHeight: 20,
  },
});
