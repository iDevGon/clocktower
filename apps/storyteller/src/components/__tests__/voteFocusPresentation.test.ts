import { describe, expect, it } from 'vitest';
import {
  getHostDesktopRailLayout,
  getVoteFocusLayout,
  HOST_DESKTOP_RAIL_TOGGLE,
} from '../HostDesktopConsoleFrame.layout';
import {
  VOTE_CLOCK_LAYER,
  VOTE_CLOCK_ORNAMENT,
  VOTE_HAND_ASSET_FILES,
  VOTE_STATE_BADGE,
  VOTE_TOKEN_BADGE,
} from '../votePresentation';

describe('vote focus presentation', () => {
  it('투표 집중 모드는 주변 패널을 화면 밖으로 밀고 중앙 영역을 넓힌다', () => {
    const idle = getVoteFocusLayout(0);
    const focused = getVoteFocusLayout(1);

    expect(idle.centerStage.marginLeft).toBe(288);
    expect(idle.centerStage.marginRight).toBe(340);
    expect(focused.header.transform).toEqual([{ translateY: -92 }]);
    expect(focused.footer.transform).toEqual([{ translateY: 92 }]);
    expect(focused.leftRail.transform).toEqual([{ translateX: -312 }]);
    expect(focused.rightRail.transform).toEqual([{ translateX: 364 }]);
    expect(focused.centerStage.marginLeft).toBe(0);
    expect(focused.centerStage.marginRight).toBe(0);
  });

  it('투표 집중 모드의 중앙 확장은 주변 패널 퇴장 후 자연스럽게 따라온다', () => {
    const early = getVoteFocusLayout(0.12);
    const middle = getVoteFocusLayout(0.58);

    expect(early.centerStage.marginLeft).toBe(288);
    expect(early.centerStage.marginRight).toBe(340);
    expect(middle.centerStage.marginLeft).toBeLessThan(180);
    expect(middle.centerStage.marginRight).toBeLessThan(212);
  });

  it('호스트 PC 좌우 레일은 각각 화면 밖으로 접히고 중앙 영역을 넓힌다', () => {
    const leftHidden = getHostDesktopRailLayout({
      voteFocusProgress: 0,
      leftRailHiddenProgress: 1,
      rightRailHiddenProgress: 0,
    });
    const rightHidden = getHostDesktopRailLayout({
      voteFocusProgress: 0,
      leftRailHiddenProgress: 0,
      rightRailHiddenProgress: 1,
    });

    expect(leftHidden.leftRail.transform).toEqual([{ translateX: -312 }]);
    expect(leftHidden.centerStage.marginLeft).toBe(0);
    expect(leftHidden.centerStage.marginRight).toBe(340);
    expect(rightHidden.rightRail.transform).toEqual([{ translateX: 364 }]);
    expect(rightHidden.centerStage.marginLeft).toBe(288);
    expect(rightHidden.centerStage.marginRight).toBe(0);
  });

  it('레일이 숨겨져도 화면 가장자리에는 작은 복귀 탭만 남긴다', () => {
    expect(HOST_DESKTOP_RAIL_TOGGLE.revealHandleWidth).toBeLessThanOrEqual(32);
    expect(HOST_DESKTOP_RAIL_TOGGLE.revealHandleWidth).toBeGreaterThanOrEqual(
      24,
    );
    expect(HOST_DESKTOP_RAIL_TOGGLE.animationDurationMs).toBeLessThanOrEqual(
      320,
    );
  });

  it('호스트 투표 시계 초침 레이어는 시계판 위에 고정된다', () => {
    expect(VOTE_CLOCK_LAYER.hand).toBeGreaterThan(100);
    expect(VOTE_CLOCK_LAYER.hand).toBeGreaterThan(VOTE_CLOCK_LAYER.centerHub);
  });

  it('호스트 투표 시계판은 플레이어 토큰 아래에 있고 초침만 토큰 위에 있다', () => {
    expect(VOTE_CLOCK_LAYER.face).toBeLessThan(VOTE_CLOCK_LAYER.token);
    expect(VOTE_CLOCK_LAYER.hand).toBeGreaterThan(VOTE_CLOCK_LAYER.token);
  });

  it('호스트 투표 상태는 텍스트 배지가 아니라 고대비 손 이미지로 표시한다', () => {
    expect(VOTE_STATE_BADGE.minWidth).toBeGreaterThanOrEqual(52);
    expect(VOTE_STATE_BADGE.iconSize).toBeGreaterThanOrEqual(30);
    expect(VOTE_STATE_BADGE.showTextLabel).toBe(false);
    expect(VOTE_HAND_ASSET_FILES.raised).toBe('vote-hand-raised.webp');
    expect(VOTE_HAND_ASSET_FILES.down).toBe('vote-hand-down.webp');
  });

  it('토큰 위 투표 표시는 큰 사각형이 아니라 작은 외곽 핀으로 표시한다', () => {
    expect(VOTE_TOKEN_BADGE.size).toBeLessThanOrEqual(24);
    expect(VOTE_TOKEN_BADGE.iconSize).toBeLessThanOrEqual(
      VOTE_TOKEN_BADGE.size,
    );
    expect(VOTE_TOKEN_BADGE.edgeOffset).toBeLessThan(0);
    expect(VOTE_TOKEN_BADGE.borderRadius).toBeGreaterThanOrEqual(
      VOTE_TOKEN_BADGE.size,
    );
  });

  it('호스트 투표 시계 중앙에는 붉은 점을 표시하지 않는다', () => {
    expect(VOTE_CLOCK_ORNAMENT.showCenterDot).toBe(false);
  });
});
