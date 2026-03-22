// 게임 중 참가 승인 대기 맵 (socketId → 대기 정보)
export const pendingApprovals = new Map<
  string,
  // biome-ignore lint/suspicious/noExplicitAny: socket type varies
  { playerName: string; socket: any }
>();
