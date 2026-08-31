import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  canSubmitGamblerGuess,
  getGamblerGuessPresentation,
} from '../gamblerGuessPresentation';

describe('getGamblerGuessPresentation', () => {
  it.each([
    ['idle', true, null],
    ['pending', false, '이야기꾼 확인 대기 중'],
    ['rejected', true, '이야기꾼이 제출을 반려했습니다. 다시 선택하세요.'],
    ['approved', false, '행동 완료'],
  ] as const)('%s 상태의 편집 가능 여부와 안내 문구를 반환한다', (status, canEdit, message) => {
    expect(getGamblerGuessPresentation(status)).toEqual({
      canEdit,
      message,
    });
  });
});

describe('canSubmitGamblerGuess', () => {
  it('requires both selections while the form is editable and idle', () => {
    expect(
      canSubmitGamblerGuess({
        targetPlayerId: 'p1',
        guessedRoleId: 'chef',
        canEdit: true,
        isSubmitting: false,
      }),
    ).toBe(true);

    for (const input of [
      {
        targetPlayerId: null,
        guessedRoleId: 'chef',
        canEdit: true,
        isSubmitting: false,
      },
      {
        targetPlayerId: 'p1',
        guessedRoleId: null,
        canEdit: true,
        isSubmitting: false,
      },
      {
        targetPlayerId: 'p1',
        guessedRoleId: 'chef',
        canEdit: false,
        isSubmitting: false,
      },
      {
        targetPlayerId: 'p1',
        guessedRoleId: 'chef',
        canEdit: true,
        isSubmitting: true,
      },
    ]) {
      expect(canSubmitGamblerGuess(input)).toBe(false);
    }
  });
});

describe('GamblerGuessPrompt source contract', () => {
  const promptSource = readFileSync(
    'src/components/GamblerGuessPrompt.tsx',
    'utf8',
  );
  const promptStylesSource = readFileSync(
    'src/components/GamblerGuessPrompt.styles.ts',
    'utf8',
  );
  const nightActionSource = readFileSync(
    'src/components/NightActionPrompt.tsx',
    'utf8',
  );
  const nightPhaseSource = readFileSync(
    'src/components/phases/NightPhase.tsx',
    'utf8',
  );
  const gameSource = readFileSync('app/game.tsx', 'utf8');

  it('renders the Gambler prompt before the passive action branch', () => {
    expect(nightActionSource).toContain(
      "import { GamblerGuessPrompt } from './GamblerGuessPrompt';",
    );
    expect(nightActionSource.indexOf('<GamblerGuessPrompt')).toBeGreaterThan(
      -1,
    );
    expect(nightActionSource.indexOf('<GamblerGuessPrompt')).toBeLessThan(
      nightActionSource.indexOf("actionDef.type === 'passive'"),
    );
  });

  it('provides accessible target and role pickers with disabled state', () => {
    expect(promptSource).toContain('accessibilityLabel="추측 대상 선택"');
    expect(promptSource).toContain('accessibilityLabel="추측 역할 선택"');
    expect(promptSource).toContain(
      'accessibilityState={{ disabled: !canEdit }}',
    );
    expect(promptSource).toContain('<ScrollView');
    expect(promptStylesSource).toMatch(/selector: \{[\s\S]*?minHeight: 48,/);
    expect(promptStylesSource).toMatch(
      /submitButton: \{[\s\S]*?minHeight: 48,/,
    );
  });

  it('does not render adjudication details', () => {
    for (const forbidden of ['정답', '오답', '맞음', '틀림']) {
      expect(promptSource).not.toContain(forbidden);
    }
  });

  it('wires active roles, joined travellers, status, and submission through the night phase', () => {
    expect(gameSource).toContain('const gamblerRoleOptions = useMemo');
    expect(gameSource).toContain('getActiveRoles({');
    expect(gameSource).toContain('excludedRoleIds:');
    expect(gameSource).toContain('player.travellerRoleId');
    expect(gameSource).toContain('gamblerGuessStatus={gamblerGuessStatus}');
    expect(gameSource).toContain('onSubmitGamblerGuess={submitGamblerGuess}');
    expect(nightPhaseSource).toContain('gamblerRoles={gamblerRoles}');
    expect(nightPhaseSource).toContain(
      'onSubmitGamblerGuess={onSubmitGamblerGuess}',
    );
  });
});
