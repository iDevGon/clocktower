import {
  DAY_SUB_PHASE_ENTRIES,
  GAME_FLOW,
  GAME_RULES,
  PHASE_ENTRIES,
  STATUS_ENTRIES,
  TEAM_COLORS,
  type Team,
  TROUBLE_BREWING_ROLES,
} from '@clocktower/shared';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type TabId = 'roles' | 'statuses' | 'rules' | 'flow';

const TABS: { id: TabId; label: string }[] = [
  { id: 'roles', label: '역할' },
  { id: 'statuses', label: '상태' },
  { id: 'rules', label: '규칙' },
  { id: 'flow', label: '진행순서' },
];

interface DictionaryModalProps {
  visible: boolean;
  onClose: () => void;
}

const TEAM_ORDER: Array<{ team: Team; label: string }> = [
  { team: 'townsfolk', label: '마을주민' },
  { team: 'outsider', label: '외지인' },
  { team: 'minion', label: '하수인' },
  { team: 'demon', label: '악마' },
];

function RolesTab() {
  return (
    <View style={tabStyles.section}>
      {TEAM_ORDER.map(({ team, label }) => {
        const roles = TROUBLE_BREWING_ROLES.filter((r) => r.team === team);
        if (roles.length === 0) return null;
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
              <Text style={tabStyles.teamCount}>{roles.length}</Text>
            </View>
            {roles.map((role) => (
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
                </View>
                <Text style={tabStyles.abilityText}>{role.ability}</Text>
              </View>
            ))}
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

function FlowTab() {
  return (
    <View style={tabStyles.section}>
      {GAME_FLOW.map((item) => (
        <View key={item.step} style={tabStyles.card}>
          <Text style={tabStyles.flowStep}>{item.step}</Text>
          <Text style={tabStyles.abilityText}>{item.description}</Text>
        </View>
      ))}
    </View>
  );
}

export function DictionaryModal({ visible, onClose }: DictionaryModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('roles');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>사전</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>

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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
          >
            {activeTab === 'roles' && <RolesTab />}
            {activeTab === 'statuses' && <StatusesTab />}
            {activeTab === 'rules' && <RulesTab />}
            {activeTab === 'flow' && <FlowTab />}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: '#1a1a1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  title: {
    color: '#e0ddd8',
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a30',
  },
  closeText: {
    color: '#908e8a',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#5dade2',
  },
  tabText: {
    color: '#5c5a58',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#5dade2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
    color: '#5c5a58',
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#121214',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e2e34',
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
    fontWeight: '700',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  abilityText: {
    color: '#908e8a',
    fontSize: 13,
    lineHeight: 20,
  },
  ruleTitle: {
    color: '#c4a050',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  flowStep: {
    color: '#5dade2',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
});
