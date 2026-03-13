import type { Role, Team } from '@clocktower/shared';
import { StyleSheet, Text, View } from 'react-native';
import type { EvilInfo } from '../stores/playerStore';
import { AbilityText } from '@clocktower/shared';

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
  evilInfo?: EvilInfo | null;
}

export function RoleCard({ role, evilInfo }: RoleCardProps) {
  const teamStyle = TEAM_STYLES[role.team];

  return (
    <View style={[styles.card, { borderColor: teamStyle.borderColor }]}>
      <Text style={[styles.teamLabel, { color: teamStyle.labelColor }]}>
        {teamStyle.label}
      </Text>
      <Text style={styles.roleName}>{role.name}</Text>
      <View style={styles.divider} />
      <AbilityText text={role.ability} style={styles.ability} />

      {evilInfo && role.team === 'demon' && (
        <View style={styles.evilInfoSection}>
          <View style={styles.divider} />
          {evilInfo.minionNames && evilInfo.minionNames.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>하수인</Text>
              <Text style={styles.infoValue}>
                {evilInfo.minionNames.join(', ')}
              </Text>
            </View>
          )}
          {evilInfo.bluffRoles && evilInfo.bluffRoles.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>블러프</Text>
              <Text style={styles.infoValue}>
                {evilInfo.bluffRoles.map((r) => r.name).join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}

      {evilInfo && role.team === 'minion' && (
        <View style={styles.evilInfoSection}>
          <View style={styles.divider} />
          {evilInfo.demonName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>악마</Text>
              <Text style={styles.infoValue}>{evilInfo.demonName}</Text>
            </View>
          )}
          {evilInfo.otherMinionNames &&
            evilInfo.otherMinionNames.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>다른 하수인</Text>
                <Text style={styles.infoValue}>
                  {evilInfo.otherMinionNames.join(', ')}
                </Text>
              </View>
            )}
        </View>
      )}
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
  evilInfoSection: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#b85c5c',
    fontSize: 13,
    fontWeight: '600',
    width: 80,
  },
  infoValue: {
    color: '#d0ccc8',
    fontSize: 13,
    flex: 1,
  },
});
