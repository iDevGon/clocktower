import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const panelSource = readFileSync(
  resolve(process.cwd(), 'src/components/NightFeedbackPanel.tsx'),
  'utf8',
);
const styleSource = readFileSync(
  resolve(process.cwd(), 'src/components/NightFeedbackPanel.styles.ts'),
  'utf8',
);

function extractFeedbackComposerCall() {
  const call = panelSource.match(/<FeedbackComposer[\s\S]*?\/>/)?.[0];
  expect(call).toBeDefined();
  return call as string;
}

describe('night feedback suggestion integration', () => {
  it('maps all six roles from the current target authoritative evidence', () => {
    expect(panelSource).toContain(
      "import { getNightFeedbackSuggestion } from './nightFeedbackSuggestion';",
    );
    expect(panelSource.match(/const currentNightAction =/g)).toHaveLength(1);
    expect(panelSource).toContain('getNightActionForFeedbackTargetOccurrence(');
    expect(panelSource).toContain(
      'getEmpathHint(players, playerOrder, targetPlayer.id)',
    );
    expect(panelSource).toContain(
      "currentNightAction?.roleId === 'ravenkeeper'",
    );
    expect(panelSource).toContain(
      'const ravenkeeperRoleName = ravenkeeperTarget?.role?.name;',
    );

    const suggestionCall = panelSource.match(
      /const suggestion = getNightFeedbackSuggestion\(\{[\s\S]*?\n {2}\}\);/,
    )?.[0];
    expect(suggestionCall).toBeDefined();
    expect(suggestionCall).toContain('roleId: activeRoleId');
    expect(suggestionCall).toContain('isMalfunctioning');
    expect(suggestionCall).toContain(
      'empathEvilCount: currentEmpathHint?.evilCount',
    );
    expect(suggestionCall).toContain(
      'chefEvilPairCount: chefHint?.evilPairCount',
    );
    expect(suggestionCall).toContain(
      'jugglerCorrectCount: jugglerCorrectCount?.[targetPlayer.id]',
    );
    expect(suggestionCall).toContain(
      'fortuneTellerResult: currentNightAction?.fortuneTellerResult',
    );
    expect(suggestionCall).toContain('executedRoleName');
    expect(suggestionCall).toContain('ravenkeeperRoleName');
  });

  it('passes only the typed suggestion to the production composer call', () => {
    const composerCall = extractFeedbackComposerCall();

    expect(composerCall).toContain('suggestion={suggestion}');
    expect(composerCall).toContain('action={currentNightAction}');
    expect(composerCall).not.toContain('suggestedNumber=');
    expect(composerCall).not.toContain('highlightedRoleName=');
  });

  it('renders the suggestion reason with gold emphasis and a clear null reason', () => {
    expect(panelSource).toContain('suggestion.reason');
    expect(panelSource).toContain('현재 추천 피드백');
    expect(panelSource).toContain('추천 피드백 없음');
    expect(panelSource).toContain(
      '취함·중독 등으로 정확한 추천값을 제공하지 않습니다.',
    );
    expect(panelSource).toContain('확정된 추천 정보가 없습니다.');

    const suggestedStyle = styleSource.match(
      /recommendationSuggested: \{[\s\S]*?^ {2}\},/m,
    )?.[0];
    expect(suggestedStyle).toBeDefined();
    expect(suggestedStyle).toContain(
      "backgroundColor: 'rgba(209, 170, 105, 0.18)'",
    );
    expect(suggestedStyle).toContain("borderColor: '#d1aa69'");
    expect(suggestedStyle).toContain("shadowColor: '#d1aa69'");
    expect(suggestedStyle).toContain('elevation: 8');
  });

  it('announces asynchronous recommendation changes politely', () => {
    expect(panelSource).toMatch(
      /<View\s+style=\{\[[\s\S]*?modalStyles\.recommendation[\s\S]*?\]\}\s+accessibilityLiveRegion="polite"\s*>/,
    );
  });
});
