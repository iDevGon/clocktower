import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PLAYER_VOTE_CLOCK_LAYER,
  PLAYER_VOTE_CLOCK_ORNAMENT,
  PLAYER_VOTE_HAND_ASSET_FILES,
  PLAYER_VOTE_NODE_BADGE,
  PLAYER_VOTE_STATE_BADGE,
} from '../VoteClockRing.presentation';
import {
  getVoteUnavailableMessage,
  shouldShowVoteControl,
  VOTE_CONSENT_READY_ICON,
} from '../VotePrompt.presentation';

const votePromptSource = readFileSync('src/components/VotePrompt.tsx', 'utf8');

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

  it('사망한 플레이어가 유령표를 이미 쓰면 다른 투표 상태보다 우선해 설명한다', () => {
    expect(
      getVoteUnavailableMessage({
        isAlive: false,
        deadVoteUsed: true,
        hasPassed: false,
      }),
    ).toBe('유령표를 이미 사용했습니다');
    expect(
      getVoteUnavailableMessage({
        isAlive: false,
        deadVoteUsed: true,
        hasPassed: true,
      }),
    ).toBe('유령표를 이미 사용했습니다');
  });

  it('기존 투표 완료와 대기 메시지를 유지한다', () => {
    expect(
      getVoteUnavailableMessage({
        isAlive: true,
        deadVoteUsed: false,
        hasPassed: true,
      }),
    ).toBe('투표 완료. 결과를 기다리는 중…');
    expect(
      getVoteUnavailableMessage({
        isAlive: true,
        deadVoteUsed: false,
        hasPassed: false,
      }),
    ).toBe('다른 플레이어의 투표를 기다리는 중…');
  });

  it.each([
    {
      label: '변론 중인 사용한 유령표',
      input: {
        isDefensePhase: true,
        isCountingDown: false,
        canVote: false,
        hasPassed: true,
        isVoteUnavailable: true,
        hasActiveVoteClock: true,
      },
      expected: false,
    },
    {
      label: '카운트다운 중인 일반 투표',
      input: {
        isDefensePhase: false,
        isCountingDown: true,
        canVote: false,
        hasPassed: false,
        isVoteUnavailable: false,
        hasActiveVoteClock: false,
      },
      expected: true,
    },
    {
      label: '투표 순서가 지나지 않은 일반 투표',
      input: {
        isDefensePhase: false,
        isCountingDown: false,
        canVote: true,
        hasPassed: false,
        isVoteUnavailable: false,
        hasActiveVoteClock: true,
      },
      expected: true,
    },
    {
      label: '투표 순서가 지난 일반 투표',
      input: {
        isDefensePhase: false,
        isCountingDown: false,
        canVote: false,
        hasPassed: true,
        isVoteUnavailable: false,
        hasActiveVoteClock: true,
      },
      expected: false,
    },
    {
      label: '카운트다운 중인 사용한 유령표',
      input: {
        isDefensePhase: false,
        isCountingDown: true,
        canVote: false,
        hasPassed: false,
        isVoteUnavailable: true,
        hasActiveVoteClock: false,
      },
      expected: true,
    },
    {
      label: '투표 순서가 지난 사용한 유령표',
      input: {
        isDefensePhase: false,
        isCountingDown: false,
        canVote: false,
        hasPassed: true,
        isVoteUnavailable: true,
        hasActiveVoteClock: true,
      },
      expected: true,
    },
    {
      label: '투표 종료 후 사용한 유령표',
      input: {
        isDefensePhase: false,
        isCountingDown: false,
        canVote: false,
        hasPassed: true,
        isVoteUnavailable: true,
        hasActiveVoteClock: false,
      },
      expected: false,
    },
  ])('$label에서 투표 컨트롤 표시를 $expected로 판단한다', ({
    input,
    expected,
  }) => {
    expect(shouldShowVoteControl(input)).toBe(expected);
  });

  it('사용한 유령표는 비활성 안내로 표시하고 핸들러에서도 선행 투표를 차단한다', () => {
    expect(votePromptSource).toContain(
      'const isAlive = usePlayerStore((s) => s.isAlive);',
    );
    expect(votePromptSource).toContain(
      'const deadVoteUsed = usePlayerStore((s) => s.deadVoteUsed);',
    );
    expect(votePromptSource).toContain('getVoteUnavailableMessage({');
    expect(votePromptSource).toContain('shouldShowVoteControl({');
    expect(votePromptSource).toContain('disabled={isVoteUnavailable}');
    expect(votePromptSource).toMatch(
      /const handleToggle = \(\) => \{\s+if \(isVoteUnavailable\) return;\s+const newValue[\s\S]*?preselectVote\(newValue\);/,
    );
  });
});
