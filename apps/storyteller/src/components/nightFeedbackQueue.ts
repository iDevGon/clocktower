export function getPendingFeedbackIndex<T>(
  targets: T[],
  sentIndices: Set<number>,
): number | null {
  const index = targets.findIndex((_, i) => !sentIndices.has(i));
  return index >= 0 ? index : null;
}
