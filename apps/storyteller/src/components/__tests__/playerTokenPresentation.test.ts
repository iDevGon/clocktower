import { describe, expect, it } from 'vitest';
import { PLAYER_TOKEN_ROLE_TEXT } from '../PlayerToken.presentation';

describe('player token presentation', () => {
  it('직업명은 한 줄 말줄임 대신 축소와 줄바꿈으로 온전히 보이게 한다', () => {
    expect(PLAYER_TOKEN_ROLE_TEXT.numberOfLines).toBeGreaterThanOrEqual(2);
    expect(PLAYER_TOKEN_ROLE_TEXT.adjustsFontSizeToFit).toBe(true);
    expect(PLAYER_TOKEN_ROLE_TEXT.minimumFontScale).toBeLessThanOrEqual(0.82);
  });
});
