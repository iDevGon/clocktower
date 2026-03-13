import type { Player } from '@clocktower/shared';
import { AbilityText } from '@clocktower/shared';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';

interface DrunkFakeRoleModalProps {
  drunkModalPlayer: Player | null;
  onClose: () => void;
  availableTownsfolk: { id: string; name: string; ability: string }[];
  onChangeFakeRole: (fakeRoleId: string) => void;
  onRandomFakeRole: () => void;
  scale: number;
}

export function DrunkFakeRoleModal({
  drunkModalPlayer,
  onClose,
  availableTownsfolk,
  onChangeFakeRole,
  onRandomFakeRole,
  scale,
}: DrunkFakeRoleModalProps) {
  const s = (v: number) => Math.round(v * scale);
  return (
    <Modal
      visible={!!drunkModalPlayer}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: '#1e1e22',
            borderRadius: 12,
            width: '90%',
            maxHeight: '80%',
            borderWidth: 2,
            borderColor: '#e67e22',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              paddingHorizontal: s(16),
              paddingTop: s(16),
              paddingBottom: s(12),
              borderBottomWidth: 1,
              borderBottomColor: '#3a3a42',
            }}
          >
            <Text
              style={{
                color: '#e67e22',
                fontSize: s(18),
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: s(4),
              }}
            >
              주정뱅이 가짜 역할 변경
            </Text>
            <Text
              style={{
                color: '#908e8a',
                fontSize: s(13),
                textAlign: 'center',
              }}
            >
              {drunkModalPlayer?.name}이(가) 자신이라고 믿을 마을주민 역할
            </Text>
          </View>
          <FlatList
            data={availableTownsfolk}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{
              paddingHorizontal: s(12),
              paddingVertical: s(8),
            }}
            ListHeaderComponent={
              availableTownsfolk.length > 0 ? (
                <Pressable
                  onPress={onRandomFakeRole}
                  style={({ pressed }) => ({
                    marginBottom: s(8),
                    padding: s(12),
                    backgroundColor: pressed ? '#303040' : '#252530',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#4a4a5a',
                    alignItems: 'center' as const,
                  })}
                >
                  <Text
                    style={{
                      color: '#a0a0c0',
                      fontSize: s(14),
                      fontWeight: '600',
                    }}
                  >
                    랜덤 배정
                  </Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => {
              const isCurrentFake = drunkModalPlayer?.drunkAs === item.id;
              return (
                <Pressable
                  onPress={() => onChangeFakeRole(item.id)}
                  style={({ pressed }) => [
                    {
                      paddingVertical: s(12),
                      paddingHorizontal: s(12),
                      marginBottom: s(4),
                      backgroundColor: isCurrentFake ? '#3a2a18' : '#252528',
                      borderRadius: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: isCurrentFake ? '#e67e22' : '#555',
                    },
                    pressed && { backgroundColor: '#353538' },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      style={{
                        color: '#e0ddd8',
                        fontSize: s(15),
                        fontWeight: '600',
                      }}
                    >
                      {item.name}
                    </Text>
                    {isCurrentFake && (
                      <Text
                        style={{
                          color: '#e67e22',
                          fontSize: s(11),
                          fontWeight: '600',
                        }}
                      >
                        현재 선택
                      </Text>
                    )}
                  </View>
                  <AbilityText
                    text={item.ability}
                    style={{
                      color: '#787674',
                      fontSize: s(12),
                      lineHeight: s(17),
                    }}
                  />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text
                style={{
                  color: '#908e8a',
                  fontSize: s(14),
                  textAlign: 'center',
                  paddingVertical: s(20),
                }}
              >
                선택 가능한 마을주민 역할이 없습니다
              </Text>
            }
          />
          <Pressable
            style={{
              paddingVertical: s(14),
              borderTopWidth: 1,
              borderTopColor: '#3a3a42',
            }}
            onPress={onClose}
          >
            <Text
              style={{
                color: '#7070c4',
                fontSize: s(15),
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              닫기
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
