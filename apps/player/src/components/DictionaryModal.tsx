import {
  ALL_ROLES,
  DAY_SUB_PHASE_ENTRIES,
  EDITION_COLORS,
  EDITION_LABELS,
  GAME_FLOW,
  GAME_RULES,
  PHASE_ENTRIES,
  STATUS_ENTRIES,
  TEAM_COLORS,
  type Team,
} from '@clocktower/shared';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { styles, tabStyles } from './DictionaryModal.styles';

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
        const roles = ALL_ROLES.filter((r) => r.team === team);
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
            {roles.map((role) => {
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
                        { color: editionColor, borderColor: editionColor },
                      ]}
                    >
                      {editionLabel}
                    </Text>
                  </View>
                  <Text style={tabStyles.abilityText}>{role.ability}</Text>
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

      <Text style={tabStyles.sectionTitleWithMargin}>낮 세부 단계</Text>
      {DAY_SUB_PHASE_ENTRIES.map((sub) => (
        <View key={sub.id} style={tabStyles.card}>
          <Text style={[tabStyles.roleName, { color: sub.color }]}>
            {sub.name}
          </Text>
          <Text style={tabStyles.abilityText}>{sub.description}</Text>
        </View>
      ))}

      <Text style={tabStyles.sectionTitleWithMargin}>상세 규칙</Text>
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
