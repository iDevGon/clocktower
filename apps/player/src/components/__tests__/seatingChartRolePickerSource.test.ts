import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const gameSource = readFileSync('app/game.tsx', 'utf8');
const seatingSource = readFileSync('src/components/SeatingChart.tsx', 'utf8');
const seatingStylesSource = readFileSync(
  'src/components/SeatingChart.styles.ts',
  'utf8',
);

describe('SeatingChart role picker source', () => {
  it('passes edition roles, additional roles, and joined traveller roles to the seating chart', () => {
    expect(gameSource).toContain('seatingRoleOptions');
    expect(gameSource).toContain('getRolesForEdition(setupEditionId)');
    expect(gameSource).toContain('gameSettings?.additionalRoleIds');
    expect(gameSource).toContain('travellerRoleId');
  });

  it('selects role notes from grouped searchable role options', () => {
    expect(seatingSource).toContain('roleOptions');
    expect(seatingSource).toContain('roleSearch');
    expect(seatingSource).toContain('TEAM_ORDER');
    expect(seatingSource).toContain('filteredRoleGroups');
  });

  it('supports free-form player notes separately from expected role notes', () => {
    expect(gameSource).toContain('seatingPlayerNotes');
    expect(gameSource).toContain('setSeatingPlayerNote');
    expect(seatingSource).toContain('playerNotes');
    expect(seatingSource).toContain('onSetPlayerNote');
    expect(seatingSource).toContain('직접 메모');
    expect(seatingSource).toContain('playerNoteInput');
  });

  it('does not force the keyboard open when the note editor opens', () => {
    expect(seatingSource).not.toContain('autoFocus');
  });

  it('uses the vote-right presentation helper for seating badges', () => {
    expect(seatingSource).toContain('getVoteRightPresentation');
    expect(seatingSource).toContain('voteRight.label');
    expect(seatingSource).toContain('voteRight.state');
    expect(seatingSource).toMatch(
      /accessibilityLabel=\{`\$\{player\.name\} 예상 직업 메모, \$\{voteRight\.label\}`\}/,
    );
  });

  it('keeps only available ghost votes glowing and mutes spent votes', () => {
    expect(seatingSource).toContain(
      "const hasGhostVote = voteRight.state === 'ghost_available'",
    );
    expect(seatingSource).toContain('s.tokenGhostSpent');
    expect(seatingSource).toContain('s.voteRightSpentGlyph');
    expect(seatingStylesSource).toMatch(
      /tokenGhostSpent: \{[\s\S]*?shadowOpacity: 0,[\s\S]*?elevation: 0,/,
    );
  });

  it('preserves alive badge geometry and widens only ghost badges', () => {
    const aliveBadgeStyle = seatingStylesSource.match(
      /voteRightBadge: \{([\s\S]*?)\n {2}\},/,
    )?.[1];
    const ghostBadgeStyle = seatingStylesSource.match(
      /voteRightGhostBadge: \{([\s\S]*?)\n {2}\},/,
    )?.[1];

    expect(aliveBadgeStyle).toContain('width: 58,');
    expect(aliveBadgeStyle).toContain('paddingHorizontal: 6,');
    expect(aliveBadgeStyle).toContain('transform: [{ translateX: -29 }]');
    expect(aliveBadgeStyle).not.toContain('flexDirection');
    expect(aliveBadgeStyle).not.toContain('gap:');
    expect(ghostBadgeStyle).toContain('width: 64,');
    expect(ghostBadgeStyle).toContain('paddingHorizontal: 4,');
    expect(ghostBadgeStyle).toContain("flexDirection: 'row'");
    expect(ghostBadgeStyle).toContain('gap: 2,');
    expect(ghostBadgeStyle).toContain('transform: [{ translateX: -32 }]');
    expect(seatingSource).toContain(
      "voteRight.state !== 'alive' && s.voteRightGhostBadge",
    );
  });
});
