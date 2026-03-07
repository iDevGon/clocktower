import {
  FIRST_NIGHT_ORDER,
  getRoleById,
  OTHER_NIGHT_ORDER,
} from '@clocktower/shared';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { styles } from './NightOrderPanel.styles';

interface NightOrderPanelProps {
  day: number;
  activeRoleIds: string[];
  onActivateRole: (roleId: string | null) => void;
}

export function NightOrderPanel({
  day,
  activeRoleIds,
  onActivateRole,
}: NightOrderPanelProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const order = day <= 1 ? FIRST_NIGHT_ORDER : OTHER_NIGHT_ORDER;

  const handlePress = (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null);
      onActivateRole(null);
    } else {
      setActiveIndex(index);
      onActivateRole(order[index]);
    }
  };

  const handleNext = () => {
    const nextIndex = activeIndex === null ? 0 : activeIndex + 1;
    if (nextIndex < order.length) {
      setActiveIndex(nextIndex);
      onActivateRole(order[nextIndex]);
    } else {
      setActiveIndex(null);
      onActivateRole(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>밤 진행 순서</Text>
        <Pressable onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextText}>
            {activeIndex === null
              ? '시작'
              : activeIndex >= order.length - 1
                ? '완료'
                : '다음'}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {order.map((roleId, index) => {
          const role = getRoleById(roleId);
          const isActive = activeIndex === index;
          const isPast = activeIndex !== null && index < activeIndex;
          const isInGame = activeRoleIds.includes(roleId);
          return (
            <Pressable
              key={roleId}
              onPress={() => handlePress(index)}
              style={[
                styles.roleItem,
                isActive && styles.roleItemActive,
                isPast && styles.roleItemPast,
                !isInGame && !isActive && styles.roleItemAbsent,
              ]}
            >
              <Text
                style={[
                  styles.roleName,
                  isActive && styles.roleNameActive,
                  isPast && styles.roleNamePast,
                  !isInGame && !isActive && styles.roleNameAbsent,
                ]}
              >
                {role?.name ?? roleId}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
