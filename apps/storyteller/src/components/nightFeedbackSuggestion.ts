export type NightFeedbackSuggestion =
  | { type: 'number'; value: number; reason: string }
  | { type: 'yes_no'; value: boolean; reason: string }
  | { type: 'role'; roleName: string; reason: string };

export interface NightFeedbackSuggestionInput {
  roleId: string;
  isMalfunctioning: boolean;
  empathEvilCount?: unknown;
  chefEvilPairCount?: unknown;
  jugglerCorrectCount?: unknown;
  fortuneTellerResult?: unknown;
  revealedRoleName?: unknown;
}

function isValidCount(value: unknown, maximum?: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    (maximum === undefined || value <= maximum)
  );
}

function isValidRoleName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function getNightFeedbackSuggestion({
  roleId,
  isMalfunctioning,
  empathEvilCount,
  chefEvilPairCount,
  jugglerCorrectCount,
  fortuneTellerResult,
  revealedRoleName,
}: NightFeedbackSuggestionInput): NightFeedbackSuggestion | null {
  if (isMalfunctioning) return null;

  switch (roleId) {
    case 'empath':
      return isValidCount(empathEvilCount, 2)
        ? {
            type: 'number',
            value: empathEvilCount,
            reason: `악한 이웃 ${empathEvilCount}명`,
          }
        : null;
    case 'chef':
      return isValidCount(chefEvilPairCount)
        ? {
            type: 'number',
            value: chefEvilPairCount,
            reason: `인접 악한 쌍 ${chefEvilPairCount}개`,
          }
        : null;
    case 'juggler':
      return isValidCount(jugglerCorrectCount, 5)
        ? {
            type: 'number',
            value: jugglerCorrectCount,
            reason: `정답 추측 ${jugglerCorrectCount}개`,
          }
        : null;
    case 'fortune_teller':
      return typeof fortuneTellerResult === 'boolean'
        ? {
            type: 'yes_no',
            value: fortuneTellerResult,
            reason: fortuneTellerResult
              ? '악마 또는 붉은 청어 감지'
              : '악마 또는 붉은 청어 미감지',
          }
        : null;
    case 'undertaker':
      return isValidRoleName(revealedRoleName)
        ? {
            type: 'role',
            roleName: revealedRoleName,
            reason: '어젯밤 처형된 역할',
          }
        : null;
    case 'ravenkeeper':
      return isValidRoleName(revealedRoleName)
        ? {
            type: 'role',
            roleName: revealedRoleName,
            reason: '선택한 플레이어의 역할',
          }
        : null;
    default:
      return null;
  }
}
