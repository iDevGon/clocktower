export function getOptimisticConsentReadyIds(
  readyPlayerIds: string[],
  playerId: string,
  ready: boolean,
): string[] {
  if (!playerId) return readyPlayerIds;

  const readySet = new Set(readyPlayerIds);
  if (ready) {
    readySet.add(playerId);
  } else {
    readySet.delete(playerId);
  }
  return [...readySet];
}
