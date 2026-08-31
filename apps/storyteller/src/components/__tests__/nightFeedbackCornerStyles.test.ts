import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const feedbackStyleSource = readFileSync(
  resolve(process.cwd(), 'src/components/NightActionLog.styles.ts'),
  'utf8',
);
const modalStyleSource = readFileSync(
  resolve(process.cwd(), 'src/components/NightFeedbackPanel.styles.ts'),
  'utf8',
);

function expectRadius(source: string, styleName: string, radius: number) {
  expect(source).toMatch(
    new RegExp(`${styleName}: \\{[^}]*borderRadius: ${radius},`, 's'),
  );
}

describe('night feedback angular corners', () => {
  it('uses 3px corners for feedback choices, send action, and modal emphasis', () => {
    expectRadius(feedbackStyleSource, 'numberButton', 3);
    expectRadius(feedbackStyleSource, 'yesNoButton', 3);
    expectRadius(feedbackStyleSource, 'chip', 3);
    expectRadius(feedbackStyleSource, 'sendButton', 3);
    expectRadius(modalStyleSource, 'modal', 3);
    expectRadius(modalStyleSource, 'recommendation', 3);
  });

  it('does not broaden the corner change to search or warning surfaces', () => {
    expectRadius(feedbackStyleSource, 'searchInput', 6);
    expectRadius(feedbackStyleSource, 'drunkBanner', 4);
  });
});
