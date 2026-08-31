import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const actionsSource = readFileSync(
  resolve(process.cwd(), 'src/hooks/useGameActions.ts'),
  'utf8',
);
const panelSource = readFileSync(
  resolve(process.cwd(), 'src/components/NightFeedbackPanel.tsx'),
  'utf8',
);
const logSource = readFileSync(
  resolve(process.cwd(), 'src/components/NightActionLog.tsx'),
  'utf8',
);

describe('night feedback server callbacks', () => {
  it('밤 피드백 전송은 서버 성공 콜백 후에만 전송 완료 처리한다', () => {
    expect(actionsSource).toContain(
      "socket?.emit('night:sendFeedback', { playerId, feedback }, callback)",
    );
    expect(panelSource).toContain(
      "if (settlement === 'advance' && currentIndex != null)",
    );
    expect(panelSource).toContain(
      'setSentIndices((prev) => new Set(prev).add(currentIndex))',
    );
    expect(panelSource).not.toContain(`onSendFeedback(targetPlayer.id, fb);
    if (currentIndex != null)`);
    expect(logSource).toContain('if (!result.success) return;');
    expect(logSource).not.toContain(`onSendFeedback(action.playerId, feedback);
    setSentIndices`);
  });

  it('guards delivery before dispatch and advances only after one successful settlement', () => {
    const guardIndex = panelSource.indexOf(
      'const attemptToken = deliveryGuardRef.current.tryStart();',
    );
    const dispatchIndex = panelSource.indexOf(
      'onSendFeedback(targetPlayer.id, fb, (result) => {',
    );

    expect(guardIndex).toBeGreaterThan(-1);
    expect(dispatchIndex).toBeGreaterThan(guardIndex);
    expect(panelSource).toContain('if (attemptToken == null) return;');
    expect(panelSource).toMatch(
      /deliveryGuardRef\.current\.settle\(\s*attemptToken,\s*result\.success,?\s*\)/,
    );
    expect(panelSource).toContain("if (settlement === 'ignored') return;");
    expect(panelSource).toContain(
      "if (settlement === 'advance' && currentIndex != null)",
    );
    expect(panelSource).toContain('completionGuardRef.current.tryComplete()');
  });
});
