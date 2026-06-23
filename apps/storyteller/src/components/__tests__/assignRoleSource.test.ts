import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const actionsSource = readFileSync(
  resolve(process.cwd(), 'src/hooks/useGameActions.ts'),
  'utf8',
);
const assignRoleSource = readFileSync(
  resolve(process.cwd(), 'app/game/assign-role.tsx'),
  'utf8',
);
const lobbySource = readFileSync(
  resolve(process.cwd(), 'app/game/lobby.tsx'),
  'utf8',
);

describe('assign role action wiring', () => {
  it('역할 배정 화면은 서버 성공 후에만 뒤로 이동한다', () => {
    expect(actionsSource).toContain("'game:assignRole'");
    expect(actionsSource).toContain('(res) => {');
    expect(actionsSource).toContain('역할 배정 실패');
    expect(assignRoleSource).toContain('await assignRole(');
    expect(assignRoleSource).toContain("Alert.alert('오류'");
    expect(assignRoleSource).not.toContain(`assignRole(playerId, roleId);
      router.back();`);
    expect(lobbySource).toContain('await assignRole(');
    expect(
      lobbySource,
    ).not.toContain(`assignRole(drunkModalPlayer.id, 'drunk', fakeRoleId);
      setDrunkModalPlayer(null);`);
  });
});
