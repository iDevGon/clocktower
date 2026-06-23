import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const actionsSource = readFileSync('src/hooks/useGameActions.ts', 'utf8');

describe('harlot consent action wiring', () => {
  it('탕녀 방문 응답은 서버 성공 콜백 후에만 요청 모달을 닫는다', () => {
    expect(actionsSource).toContain(
      "socket.emit('harlot:respond', { harlotId, accepted }, (res) => {",
    );
    expect(actionsSource).toContain('if (res.success) {');
    expect(actionsSource).toContain('harlotConsentRequest: null');
    expect(
      actionsSource,
    ).not.toContain(`socket.emit('harlot:respond', { harlotId, accepted });
        usePlayerStore.getState().set({ harlotConsentRequest: null });`);
  });
});
