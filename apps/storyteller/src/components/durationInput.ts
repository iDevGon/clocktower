export type DurationParts = {
  minutes: string;
  seconds: string;
};

export type DurationDraft = {
  parts: DurationParts;
  isDirty: boolean;
};

export type DurationDraftAction =
  | { type: 'edit'; part: keyof DurationParts; value: string }
  | { type: 'sync'; value: number }
  | { type: 'reset'; value: number }
  | { type: 'preset'; value: number }
  | { type: 'apply' };

function isValidDurationSeconds(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

export function splitDurationSeconds(value: number): DurationParts {
  if (!Number.isFinite(value) || value < 0) {
    return { minutes: '0', seconds: '0' };
  }

  const total = Math.floor(value);
  if (!isValidDurationSeconds(total)) {
    return { minutes: '0', seconds: '0' };
  }

  return {
    minutes: String(Math.floor(total / 60)),
    seconds: String(total % 60),
  };
}

export function mergeDurationParts(
  minutes: string,
  seconds: string,
): number | null {
  if (!/^\d+$/.test(minutes) || !/^\d+$/.test(seconds)) return null;

  const minuteValue = Number(minutes);
  const secondValue = Number(seconds);
  if (
    !isValidDurationSeconds(minuteValue) ||
    !isValidDurationSeconds(secondValue)
  ) {
    return null;
  }

  const total = minuteValue * 60 + secondValue;
  return isValidDurationSeconds(total) ? total : null;
}

export function createDurationDraft(value: number): DurationDraft {
  return { parts: splitDurationSeconds(value), isDirty: false };
}

export function reduceDurationDraft(
  draft: DurationDraft,
  action: DurationDraftAction,
): DurationDraft {
  switch (action.type) {
    case 'edit':
      return {
        parts: { ...draft.parts, [action.part]: action.value },
        isDirty: true,
      };
    case 'sync':
      return draft.isDirty ? draft : createDurationDraft(action.value);
    case 'reset':
    case 'preset':
      return createDurationDraft(action.value);
    case 'apply': {
      const total = mergeDurationParts(
        draft.parts.minutes,
        draft.parts.seconds,
      );
      return total === null
        ? draft
        : { parts: splitDurationSeconds(total), isDirty: false };
    }
  }
}

export function canonicalizeDurationParts(parts: DurationParts): DurationParts {
  const total = mergeDurationParts(parts.minutes, parts.seconds);
  return total === null ? parts : splitDurationSeconds(total);
}

export function getDurationDraftStatus(
  draft: DurationDraft,
  authoritativeValue: number,
) {
  const totalSeconds = mergeDurationParts(
    draft.parts.minutes,
    draft.parts.seconds,
  );
  const canApply =
    draft.isDirty &&
    totalSeconds !== null &&
    totalSeconds !== authoritativeValue;

  return {
    totalSeconds,
    canApply,
    error:
      draft.isDirty && totalSeconds === null
        ? '분과 초를 숫자로 입력하세요'
        : undefined,
  };
}

export function formatDurationOption(value: number): string {
  const { minutes, seconds } = splitDurationSeconds(value);
  if (minutes === '0') return `${seconds}초`;
  if (seconds === '0') return `${minutes}분`;
  return `${minutes}분${seconds}초`;
}
