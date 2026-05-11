import { describe, expect, it } from 'vitest';
import {
  PLAYER_VOTE_CLOCK_LAYER,
  PLAYER_VOTE_CLOCK_ORNAMENT,
  PLAYER_VOTE_HAND_ASSET_FILES,
  PLAYER_VOTE_NODE_BADGE,
  PLAYER_VOTE_STATE_BADGE,
} from '../VoteClockRing.presentation';
import { VOTE_CONSENT_READY_ICON } from '../VotePrompt.presentation';

describe('player vote clock presentation', () => {
  it('투표 시계 초침은 중앙 표시와 플레이어 노드보다 위에 렌더링된다', () => {
    expect(PLAYER_VOTE_CLOCK_LAYER.hand).toBeGreaterThan(
      PLAYER_VOTE_CLOCK_LAYER.timer,
    );
    expect(PLAYER_VOTE_CLOCK_LAYER.hand).toBeGreaterThan(
      PLAYER_VOTE_CLOCK_LAYER.node,
    );
  });

  it('손 듦/내림 상태는 텍스트 배지가 아니라 고대비 손 이미지로 표시한다', () => {
    expect(PLAYER_VOTE_STATE_BADGE.minWidth).toBeGreaterThanOrEqual(44);
    expect(PLAYER_VOTE_STATE_BADGE.iconSize).toBeGreaterThanOrEqual(24);
    expect(PLAYER_VOTE_STATE_BADGE.showTextLabel).toBe(false);
    expect(PLAYER_VOTE_HAND_ASSET_FILES.raised).toBe('vote-hand-raised.webp');
    expect(PLAYER_VOTE_HAND_ASSET_FILES.down).toBe('vote-hand-down.webp');
  });

  it('시계 위 플레이어 토큰 투표 상태는 겹침이 적은 작은 핀으로 표시한다', () => {
    expect(PLAYER_VOTE_NODE_BADGE.size).toBeLessThanOrEqual(24);
    expect(PLAYER_VOTE_NODE_BADGE.iconSize).toBeLessThanOrEqual(
      PLAYER_VOTE_NODE_BADGE.size,
    );
    expect(PLAYER_VOTE_NODE_BADGE.edgeOffset).toBeLessThan(0);
    expect(PLAYER_VOTE_NODE_BADGE.borderRadius).toBeGreaterThanOrEqual(
      PLAYER_VOTE_NODE_BADGE.size,
    );
  });

  it('플레이어 투표 시계 중앙에는 붉은 점을 표시하지 않는다', () => {
    expect(PLAYER_VOTE_CLOCK_ORNAMENT.showCenterDot).toBe(false);
  });

  it('투표 준비 완료 아이콘은 큰 이미지 스프라이트 대신 즉시 렌더링되는 글리프를 쓴다', () => {
    expect(VOTE_CONSENT_READY_ICON.renderMode).toBe('glyph');
    expect(VOTE_CONSENT_READY_ICON.glyph).toBe('✓');
    expect(VOTE_CONSENT_READY_ICON.size).toBeLessThanOrEqual(24);
  });
});
