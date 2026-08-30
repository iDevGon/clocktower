export type DurationParts = {
  minutes: string;
  seconds: string;
};

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

export function applyDurationPartEdit(
  parts: DurationParts,
  part: keyof DurationParts,
  value: string,
) {
  const next = { ...parts, [part]: value };

  return {
    parts: next,
    totalSeconds: mergeDurationParts(next.minutes, next.seconds),
  };
}

export function syncDurationParts(
  value: number,
  localParts: DurationParts,
  isEditing: boolean,
): DurationParts {
  return isEditing ? localParts : splitDurationSeconds(value);
}

export function canonicalizeDurationParts(parts: DurationParts): DurationParts {
  const total = mergeDurationParts(parts.minutes, parts.seconds);
  return total === null ? parts : splitDurationSeconds(total);
}

export function formatDurationOption(value: number): string {
  const { minutes, seconds } = splitDurationSeconds(value);
  if (minutes === '0') return `${seconds}초`;
  if (seconds === '0') return `${minutes}분`;
  return `${minutes}분${seconds}초`;
}
