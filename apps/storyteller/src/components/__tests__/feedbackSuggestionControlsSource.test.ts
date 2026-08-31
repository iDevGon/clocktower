import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readComponent(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

const composerSource = readComponent('src/components/FeedbackComposer.tsx');
const numberSource = readComponent(
  'src/components/feedback/NumberFeedback.tsx',
);
const yesNoSource = readComponent('src/components/feedback/YesNoFeedback.tsx');
const roleSource = readComponent('src/components/feedback/RoleFeedback.tsx');
const styleSource = readComponent('src/components/NightActionLog.styles.ts');

function expectStyle(styleName: string, expectedSource: string) {
  const styleBlock = styleSource.match(
    new RegExp(`${styleName}: \\{[\\s\\S]*?^    \\},$`, 'm'),
  )?.[0];
  expect(styleBlock).toBeDefined();
  expect(styleBlock).toMatch(new RegExp(expectedSource));
}

describe('recommended night feedback controls', () => {
  it('routes each typed suggestion while preserving legacy fallbacks', () => {
    expect(composerSource).toContain(
      'suggestion?: NightFeedbackSuggestion | null;',
    );
    expect(composerSource).toContain(
      "suggestion?.type === 'number' ? suggestion.value : suggestedNumber",
    );
    expect(composerSource).toContain(
      "suggestion?.type === 'yes_no' ? suggestion.value : undefined",
    );
    expect(composerSource).toContain(
      "suggestion?.type === 'role'\n              ? suggestion.roleName\n              : highlightedRoleName",
    );
  });

  it('shows a Korean recommendation label and accessibility label only on the matching number', () => {
    expect(numberSource).toMatch(
      /isSuggested \? `\$\{n\}, 추천 피드백` : `\$\{n\} 피드백`/,
    );
    expect(numberSource).toMatch(/isSuggested\s*&&[\s\S]*추천/);
    expect(numberSource).toContain('isDimmed && styles.numberButtonDimmed');
  });

  it('shows a Korean recommendation label and accessibility label only on the matching yes/no choice', () => {
    expect(yesNoSource).toContain('suggestedValue?: boolean;');
    expect(yesNoSource).toMatch(
      /isSuggested \? `\$\{label\}, 추천 피드백` : `\$\{label\} 피드백`/,
    );
    expect(yesNoSource).toMatch(/isSuggested\s*&&[\s\S]*추천/);
    expect(yesNoSource).toContain('isDimmed && styles.yesNoButtonDimmed');
  });

  it('shows a Korean recommendation label and accessibility label only on the matching role', () => {
    expect(roleSource).toMatch(
      /isHighlighted \? `\$\{r\.name\}, 추천 피드백` : `\$\{r\.name\} 피드백`/,
    );
    expect(roleSource).toMatch(/isHighlighted\s*&&[\s\S]*추천/);
    expect(roleSource).toContain('isDimmed && styles.chipDimmed');
  });

  it('keeps every feedback action at least 52px tall with usable number width and angular corners', () => {
    for (const styleName of [
      'numberButton',
      'yesNoButton',
      'chip',
      'sendButton',
    ]) {
      expectStyle(styleName, 'minHeight: Math\\.max\\(52, s\\(52\\)\\)');
      expectStyle(styleName, 'borderRadius: 3');
    }
    expectStyle('numberButton', 'minWidth: Math\\.max\\(52, s\\(52\\)\\)');
  });

  it('uses gold border, background, shadow, and glow on every recommended choice', () => {
    for (const styleName of [
      'numberButtonSuggested',
      'yesNoButtonSuggested',
      'chipSuggested',
    ]) {
      expectStyle(
        styleName,
        "backgroundColor: 'rgba\\(209, 170, 105, 0\\.18\\)'",
      );
      expectStyle(styleName, "borderColor: '#d1aa69'");
      expectStyle(styleName, "shadowColor: '#d1aa69'");
      expectStyle(styleName, 'elevation: 8');
    }
    expectStyle('recommendationLabel', "color: '#d1aa69'");
  });
});
