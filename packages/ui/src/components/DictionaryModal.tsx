import type { Role, Team } from '@clocktower/shared';
import {
  ALL_ROLES,
  DAY_SUB_PHASE_ENTRIES,
  EDITION_COLORS,
  EDITION_LABELS,
  GAME_RULES,
  getNightOrderForEdition,
  getRoleById,
  PHASE_ENTRIES,
  STATUS_ENTRIES,
  TEAM_COLORS,
} from '@clocktower/shared';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, typography } from '../tokens';
import { filterDictionaryRoles } from '../utils/dictionaryFilters';
import { AbilityText } from './AbilityText';
import { RoleTips } from './RoleTips';

type TabId = 'roles' | 'statuses' | 'rules' | 'flow';

const TABS: { id: TabId; label: string }[] = [
  { id: 'roles', label: '역할' },
  { id: 'statuses', label: '표식' },
  { id: 'rules', label: '규칙' },
  { id: 'flow', label: '진행순서' },
];

interface DictionaryModalProps {
  visible: boolean;
  onClose: () => void;
  /**
   * When true, roles are grouped under team headers (마을주민, 외지인, etc.).
   * When false, roles are shown in a flat list with team & edition badges.
   * @default true
   */
  groupRolesByTeam?: boolean;
  editionId?: string;
  roleIds?: string[];
}

const TEAM_ORDER: Array<{ team: Team; label: string }> = [
  { team: 'townsfolk', label: '마을주민' },
  { team: 'outsider', label: '외지인' },
  { team: 'minion', label: '하수인' },
  { team: 'demon', label: '악마' },
];

const FLOW_BANDS = [
  {
    id: 'first',
    label: '첫째 밤',
    description: '게임 시작 첫 밤에만 진행되는 정보와 선택입니다.',
    backgroundColor: 'rgba(93, 173, 226, 0.13)',
  },
  {
    id: 'every',
    label: '모든 밤',
    description: '첫째 밤과 이후 밤에 모두 등장하는 반복 순서입니다.',
    backgroundColor: 'rgba(183, 149, 79, 0.14)',
  },
  {
    id: 'other',
    label: '이후 밤',
    description: '둘째 밤부터 새벽 전까지 진행되는 순서입니다.',
    backgroundColor: 'rgba(176, 92, 92, 0.14)',
  },
  {
    id: 'dusk',
    label: '황혼',
    description: '처형, 낮 능력, 밤 진입 전 공개 판정을 이야기꾼이 정리합니다.',
    backgroundColor: 'rgba(165, 105, 189, 0.13)',
  },
] as const;

function getTeamColor(role: Role) {
  return TEAM_COLORS[role.team] ?? colors.arcane.text.label;
}

function getOrderedRoles(order: string[], allowedRoleIds?: Set<string>) {
  return order
    .filter((roleId) => !allowedRoleIds || allowedRoleIds.has(roleId))
    .map((roleId) => getRoleById(roleId))
    .filter((role): role is Role => Boolean(role));
}

function FlowRail({ label, roles }: { label: string; roles: Role[] }) {
  return (
    <View style={tabStyles.flowRail}>
      <Text style={tabStyles.flowRailLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={tabStyles.flowRailTrack}>
          {roles.map((role, index) => (
            <View key={`${label}-${role.id}`} style={tabStyles.flowNodeGroup}>
              <View
                style={[
                  tabStyles.flowNode,
                  {
                    borderColor: getTeamColor(role),
                    backgroundColor: `${getTeamColor(role)}22`,
                  },
                ]}
              >
                <Text
                  style={[
                    tabStyles.flowNodeText,
                    { color: getTeamColor(role) },
                  ]}
                >
                  {role.name}
                </Text>
              </View>
              {index < roles.length - 1 && (
                <Text
                  style={[
                    tabStyles.flowArrow,
                    { color: getTeamColor(roles[index + 1]) },
                  ]}
                >
                  →
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FlowRoleRow({ role }: { role: Role }) {
  return (
    <View style={tabStyles.flowRoleRow}>
      <View
        style={[tabStyles.flowRoleDot, { backgroundColor: getTeamColor(role) }]}
      />
      <Text style={[tabStyles.flowRoleName, { color: getTeamColor(role) }]}>
        {role.name}
      </Text>
      <Text style={tabStyles.flowRoleAbility} numberOfLines={2}>
        {role.ability}
      </Text>
    </View>
  );
}

function GroupedRolesTab({ roles }: { roles: Role[] }) {
  return (
    <View style={tabStyles.section}>
      {TEAM_ORDER.map(({ team, label }) => {
        const teamRoles = roles.filter((r) => r.team === team);
        if (teamRoles.length === 0) return null;
        return (
          <View key={team}>
            <View
              style={[tabStyles.teamHeader, { borderColor: TEAM_COLORS[team] }]}
            >
              <View
                style={[
                  tabStyles.teamDot,
                  { backgroundColor: TEAM_COLORS[team] },
                ]}
              />
              <Text
                style={[tabStyles.teamHeaderText, { color: TEAM_COLORS[team] }]}
              >
                {label}
              </Text>
              <Text style={tabStyles.teamCount}>{teamRoles.length}</Text>
            </View>
            {teamRoles.map((role) => {
              const editionColor = EDITION_COLORS[role.edition] ?? '#908e8a';
              const editionLabel = EDITION_LABELS[role.edition] ?? role.edition;
              return (
                <View key={role.id} style={tabStyles.card}>
                  <View style={tabStyles.cardHeader}>
                    <Text
                      style={[
                        tabStyles.roleName,
                        { color: TEAM_COLORS[role.team] },
                      ]}
                    >
                      {role.name}
                    </Text>
                    <Text
                      style={[
                        tabStyles.editionBadge,
                        {
                          color: editionColor,
                          borderColor: editionColor,
                        },
                      ]}
                    >
                      {editionLabel}
                    </Text>
                  </View>
                  <AbilityText
                    text={role.ability}
                    style={tabStyles.abilityText}
                  />
                  <RoleTips roleId={role.id} />
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function FlatRolesTab({ roles }: { roles: Role[] }) {
  return (
    <View style={tabStyles.section}>
      {TEAM_ORDER.map(({ team, label }) => {
        const teamRoles = roles.filter((r) => r.team === team);
        if (teamRoles.length === 0) return null;
        return (
          <View key={team}>
            <View
              style={[tabStyles.teamHeader, { borderColor: TEAM_COLORS[team] }]}
            >
              <View
                style={[
                  tabStyles.teamDot,
                  { backgroundColor: TEAM_COLORS[team] },
                ]}
              />
              <Text
                style={[tabStyles.teamHeaderText, { color: TEAM_COLORS[team] }]}
              >
                {label}
              </Text>
              <Text style={tabStyles.teamCount}>{teamRoles.length}</Text>
            </View>
            {teamRoles.map((role) => {
              const editionLabel = EDITION_LABELS[role.edition] ?? role.edition;
              const editionColor = EDITION_COLORS[role.edition] ?? '#908e8a';
              return (
                <View key={role.id} style={tabStyles.card}>
                  <View style={tabStyles.cardHeader}>
                    <Text
                      style={[
                        tabStyles.roleName,
                        { color: TEAM_COLORS[role.team] },
                      ]}
                    >
                      {role.name}
                    </Text>
                    <Text
                      style={[
                        tabStyles.editionBadge,
                        {
                          color: editionColor,
                          borderColor: editionColor,
                        },
                      ]}
                    >
                      {editionLabel}
                    </Text>
                  </View>
                  <AbilityText
                    text={role.ability}
                    style={tabStyles.abilityText}
                  />
                  <RoleTips roleId={role.id} />
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function StatusesTab() {
  return (
    <View style={tabStyles.section}>
      {STATUS_ENTRIES.map((status) => (
        <View key={status.id} style={tabStyles.card}>
          <View style={tabStyles.cardHeader}>
            <View
              style={[tabStyles.statusDot, { backgroundColor: status.color }]}
            />
            <Text style={[tabStyles.roleName, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          <Text style={tabStyles.abilityText}>{status.description}</Text>
        </View>
      ))}
    </View>
  );
}

function RulesTab() {
  return (
    <View style={tabStyles.section}>
      <Text style={tabStyles.sectionTitle}>게임 페이즈</Text>
      {PHASE_ENTRIES.map((phase) => (
        <View key={phase.id} style={tabStyles.card}>
          <Text style={[tabStyles.roleName, { color: phase.color }]}>
            {phase.name}
          </Text>
          <Text style={tabStyles.abilityText}>{phase.description}</Text>
        </View>
      ))}

      <Text style={[tabStyles.sectionTitle, { marginTop: 20 }]}>
        낮 세부 단계
      </Text>
      {DAY_SUB_PHASE_ENTRIES.map((sub) => (
        <View key={sub.id} style={tabStyles.card}>
          <Text style={[tabStyles.roleName, { color: sub.color }]}>
            {sub.name}
          </Text>
          <Text style={tabStyles.abilityText}>{sub.description}</Text>
        </View>
      ))}

      <Text style={[tabStyles.sectionTitle, { marginTop: 20 }]}>상세 규칙</Text>
      {GAME_RULES.map((rule) => (
        <View key={rule.title} style={tabStyles.card}>
          <Text style={tabStyles.ruleTitle}>{rule.title}</Text>
          <Text style={tabStyles.abilityText}>{rule.content}</Text>
        </View>
      ))}
    </View>
  );
}

function FlowTab({
  editionId,
  roleIds,
}: {
  editionId?: string;
  roleIds?: string[];
}) {
  const flowEditionId = editionId ?? 'trouble_brewing';
  const allowedRoleIds = roleIds ? new Set(roleIds) : undefined;
  const firstOrder = getOrderedRoles(
    getNightOrderForEdition(flowEditionId, 1),
    allowedRoleIds,
  );
  const otherOrder = getOrderedRoles(
    getNightOrderForEdition(flowEditionId, 2),
    allowedRoleIds,
  );
  const firstRoleIds = new Set(firstOrder.map((role) => role.id));
  const otherRoleIds = new Set(otherOrder.map((role) => role.id));
  const firstOnlyRoles = firstOrder.filter(
    (role) => !otherRoleIds.has(role.id),
  );
  const everyNightRoles = firstOrder.filter((role) =>
    otherRoleIds.has(role.id),
  );
  const otherOnlyRoles = otherOrder.filter(
    (role) => !firstRoleIds.has(role.id),
  );
  const bandRoles = {
    first: firstOnlyRoles,
    every: everyNightRoles,
    other: otherOnlyRoles,
    dusk: [],
  };

  return (
    <View style={tabStyles.section}>
      <View style={tabStyles.flowRails}>
        <FlowRail label="첫째 밤" roles={firstOrder} />
        <FlowRail label="이후 밤" roles={otherOrder} />
      </View>

      {FLOW_BANDS.map((band) => (
        <View
          key={band.id}
          style={[
            tabStyles.flowBand,
            { backgroundColor: band.backgroundColor },
          ]}
        >
          <Text style={tabStyles.flowBandLabel}>{band.label}</Text>
          <Text style={tabStyles.flowBandDescription}>{band.description}</Text>
          {bandRoles[band.id].length > 0 ? (
            bandRoles[band.id].map((role) => (
              <FlowRoleRow key={`${band.id}-${role.id}`} role={role} />
            ))
          ) : (
            <Text style={tabStyles.flowEmptyText}>
              이 구간에 표시할 밤 역할이 없습니다.
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

export function DictionaryModal({
  visible,
  onClose,
  groupRolesByTeam = true,
  editionId,
  roleIds,
}: DictionaryModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('roles');
  const [roleQuery, setRoleQuery] = useState('');
  const roles = useMemo(
    () => filterDictionaryRoles(ALL_ROLES, { roleIds, query: roleQuery }),
    [roleIds, roleQuery],
  );

  const tabBar = (
    <View style={styles.tabBar}>
      {TABS.map((tab) => (
        <Pressable
          key={tab.id}
          onPress={() => setActiveTab(tab.id)}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const content = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      nestedScrollEnabled
    >
      {activeTab === 'roles' && (
        <TextInput
          value={roleQuery}
          onChangeText={setRoleQuery}
          placeholder="직업 검색"
          placeholderTextColor={colors.arcane.text.dead}
          style={styles.searchInput}
        />
      )}
      {activeTab === 'roles' &&
        (groupRolesByTeam ? (
          <GroupedRolesTab roles={roles} />
        ) : (
          <FlatRolesTab roles={roles} />
        ))}
      {activeTab === 'statuses' && <StatusesTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'flow' && (
        <FlowTab editionId={editionId} roleIds={roleIds} />
      )}
    </ScrollView>
  );

  if (groupRolesByTeam) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.dismissArea} onPress={onClose} />
          <View style={styles.containerGrouped}>
            <View style={styles.header}>
              <Text style={styles.title}>사전</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>닫기</Text>
              </Pressable>
            </View>
            {tabBar}
            {content}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.containerFlat} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>사전</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>
          {tabBar}
          {content}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13,7,3,0.82)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  containerGrouped: {
    backgroundColor: colors.arcane.surface.apparatus,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    height: '85%',
    borderTopWidth: 1,
    borderColor: colors.arcane.border.brassDim,
  },
  containerFlat: {
    backgroundColor: colors.arcane.surface.apparatus,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '90%',
    minHeight: 300,
    flex: 1,
    borderTopWidth: 1,
    borderColor: colors.arcane.border.brassDim,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.arcane.border.brassDim,
  },
  title: {
    color: colors.arcane.text.strong,
    fontSize: 18,
    fontFamily: typography.fontFamily.display,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.arcane.surface.ledger,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
  },
  closeText: {
    color: colors.arcane.text.label,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.arcane.border.brassDim,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.arcane.accent.sapphireLens,
    backgroundColor: colors.arcane.accent.midnightInk,
  },
  tabText: {
    color: colors.arcane.text.dead,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
  tabTextActive: {
    color: colors.arcane.accent.sapphireLens,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    borderRadius: 6,
    backgroundColor: colors.arcane.surface.base,
    color: colors.arcane.text.strong,
    fontFamily: typography.fontFamily.body,
    fontSize: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
});

const tabStyles = StyleSheet.create({
  section: {
    gap: 10,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamHeaderText: {
    fontSize: 15,
    fontWeight: '700',
  },
  teamCount: {
    color: colors.arcane.text.dead,
    fontSize: 12,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  sectionTitle: {
    color: colors.arcane.text.strong,
    fontSize: 16,
    fontFamily: typography.fontFamily.display,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.arcane.surface.base,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  roleName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
  },
  editionBadge: {
    fontSize: 9,
    fontFamily: typography.fontFamily.bodyBold,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  abilityText: {
    color: colors.arcane.text.muted,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: typography.fontFamily.body,
  },
  ruleTitle: {
    color: colors.arcane.text.label,
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
    marginBottom: 6,
  },
  flowRails: {
    gap: 8,
    backgroundColor: colors.arcane.surface.base,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    padding: 10,
  },
  flowRail: {
    gap: 6,
  },
  flowRailLabel: {
    color: colors.arcane.text.label,
    fontSize: 12,
    fontFamily: typography.fontFamily.bodyBold,
  },
  flowRailTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  flowNodeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowNode: {
    minWidth: 58,
    maxWidth: 92,
    minHeight: 30,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  flowNodeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bodyBold,
    textAlign: 'center',
  },
  flowArrow: {
    width: 20,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
  flowBand: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    padding: 12,
    gap: 8,
  },
  flowBandLabel: {
    color: colors.arcane.accent.sapphireLens,
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
  },
  flowBandDescription: {
    color: colors.arcane.text.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: typography.fontFamily.body,
  },
  flowRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.arcane.border.brassDim,
    paddingTop: 8,
  },
  flowRoleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  flowRoleName: {
    width: 76,
    fontSize: 13,
    fontFamily: typography.fontFamily.bodyBold,
  },
  flowRoleAbility: {
    flex: 1,
    color: colors.arcane.text.muted,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: typography.fontFamily.body,
  },
  flowEmptyText: {
    color: colors.arcane.text.dead,
    fontSize: 12,
    fontFamily: typography.fontFamily.body,
  },
});
