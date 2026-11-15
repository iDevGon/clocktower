import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('강퇴 확인의 웹 호환성', () => {
  for (const screen of ['lobby', 'grimoire']) {
    it(`${screen}에서 웹에서 동작하지 않는 네이티브 Alert로 강퇴를 막지 않는다`, () => {
      const source = readFileSync(
        resolve(process.cwd(), `app/game/${screen}.tsx`),
        'utf8',
      );

      expect(source).not.toMatch(
        /Alert\.alert\(\s*`\$\{(?:item|playerName)[^`]* 강퇴`/,
      );
      expect(source).toMatch(/<ConfirmModal[\s\S]*?confirmText="강퇴"/);
    });
  }
});
