export const VOTE_FOCUS_CHROME = {
  headerOffset: -92,
  footerOffset: 92,
  leftRailWidth: 288,
  rightRailWidth: 340,
  railExitGap: 24,
  centerExpandDelay: 0.16,
} as const;

export const HOST_DESKTOP_RAIL_TOGGLE = {
  revealHandleWidth: 28,
  revealHandleHeight: 72,
  animationDurationMs: 300,
} as const;

function clampProgress(progress: number): number {
  'worklet';
  return Math.max(0, Math.min(1, progress));
}

export function getVoteFocusCenterProgress(progress: number) {
  'worklet';
  const p = clampProgress(progress);
  if (p <= VOTE_FOCUS_CHROME.centerExpandDelay) return 0;
  return (
    (p - VOTE_FOCUS_CHROME.centerExpandDelay) /
    (1 - VOTE_FOCUS_CHROME.centerExpandDelay)
  );
}

export function getVoteFocusLayout(progress: number) {
  return getHostDesktopRailLayout({
    voteFocusProgress: progress,
    leftRailHiddenProgress: 0,
    rightRailHiddenProgress: 0,
  });
}

export function getHostDesktopRailLayout({
  voteFocusProgress,
  leftRailHiddenProgress,
  rightRailHiddenProgress,
}: {
  voteFocusProgress: number;
  leftRailHiddenProgress: number;
  rightRailHiddenProgress: number;
}) {
  'worklet';
  const focusP = clampProgress(voteFocusProgress);
  const leftHiddenP = clampProgress(leftRailHiddenProgress);
  const rightHiddenP = clampProgress(rightRailHiddenProgress);
  const centerFocusP = getVoteFocusCenterProgress(focusP);
  const leftStageP = Math.max(centerFocusP, leftHiddenP);
  const rightStageP = Math.max(centerFocusP, rightHiddenP);
  const leftRailP = Math.max(focusP, leftHiddenP);
  const rightRailP = Math.max(focusP, rightHiddenP);
  const leftRailExitDistance =
    VOTE_FOCUS_CHROME.leftRailWidth + VOTE_FOCUS_CHROME.railExitGap;
  const rightRailExitDistance =
    VOTE_FOCUS_CHROME.rightRailWidth + VOTE_FOCUS_CHROME.railExitGap;

  return {
    header: {
      transform: [{ translateY: VOTE_FOCUS_CHROME.headerOffset * focusP }],
    },
    footer: {
      transform: [{ translateY: VOTE_FOCUS_CHROME.footerOffset * focusP }],
    },
    leftRail: {
      transform: [{ translateX: -leftRailExitDistance * leftRailP }],
    },
    rightRail: {
      transform: [{ translateX: rightRailExitDistance * rightRailP }],
    },
    centerStage: {
      marginLeft: VOTE_FOCUS_CHROME.leftRailWidth * (1 - leftStageP),
      marginRight: VOTE_FOCUS_CHROME.rightRailWidth * (1 - rightStageP),
    },
  };
}
