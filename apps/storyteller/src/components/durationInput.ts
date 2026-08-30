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
