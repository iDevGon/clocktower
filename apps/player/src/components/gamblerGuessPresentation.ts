import type { GamblerGuessStatus } from '@clocktower/shared';

interface GamblerGuessPresentation {
  canEdit: boolean;
  message: string | null;
}

export function getGamblerGuessPresentation(
  status: GamblerGuessStatus,
): GamblerGuessPresentation {
  switch (status) {
    case 'pending':
      return { canEdit: false, message: '이야기꾼 확인 대기 중' };
    case 'rejected':
      return {
        canEdit: true,
        message: '이야기꾼이 제출을 반려했습니다. 다시 선택하세요.',
      };
    case 'approved':
      return { canEdit: false, message: '행동 완료' };
    default:
      return { canEdit: true, message: null };
  }
}

export function canSubmitGamblerGuess({
  targetPlayerId,
  guessedRoleId,
  canEdit,
  isSubmitting,
}: {
  targetPlayerId: string | null;
  guessedRoleId: string | null;
  canEdit: boolean;
  isSubmitting: boolean;
}): boolean {
  return Boolean(targetPlayerId && guessedRoleId && canEdit && !isSubmitting);
}
