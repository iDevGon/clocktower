import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const lobbySource = readFileSync(
  resolve(process.cwd(), 'app/game/lobby.tsx'),
  'utf8',
);
const clockSpeedSettingSource = readFileSync(
  resolve(process.cwd(), 'src/components/ClockSpeedSetting.tsx'),
  'utf8',
);

describe('lobby seating source', () => {
  it('좌석 배치 화면은 드래그 토큰으로 플레이어 순서를 바꾼다', () => {
    expect(lobbySource).toContain('DraggablePlayerToken');
    expect(lobbySource).toContain('onSwap={handleSeatSwap}');
    expect(lobbySource).toContain('commitPlayerOrder(nextOrder)');
  });

  it('로비 참가자는 좌석 배치와 목록 보기 사이를 토글할 수 있다', () => {
    expect(lobbySource).toContain('showSeatingBoard');
    expect(lobbySource).toContain('setShowSeatingBoard');
    expect(lobbySource).toContain('renderPlayerList');
    expect(lobbySource).toContain('좌석 배치');
  });

  it('좌석 배치 토글은 참가자 명부 헤더의 우측 액션으로 배치한다', () => {
    expect(lobbySource).toContain('styles.panelHeaderActions');
    expect(lobbySource).toMatch(
      /<View style=\{styles\.panelHeader\}>[\s\S]*styles\.panelHeaderActions[\s\S]*label="좌석 배치"[\s\S]*<\/View>/,
    );
  });

  it('데스크톱 운영 패널은 포커스 시 에디션 배분 영역 위로 확장된다', () => {
    expect(lobbySource).toContain('settingsFocused');
    expect(lobbySource).toContain('setSettingsFocused(true)');
    expect(lobbySource).toContain('styles.desktopSettingsPanelFocused');
    expect(lobbySource).toContain('styles.desktopSetupPanelCovered');
  });

  it('데스크톱 운영 패널 확장은 애니메이션으로 처리하고 hover-out 깜빡임을 만들지 않는다', () => {
    expect(lobbySource).toContain('new Animated.Value(0)');
    expect(lobbySource).toContain('Animated.timing(settingsPanelProgress');
    expect(lobbySource).toContain('settingsPanelAnimatedStyle');
    expect(lobbySource).not.toContain('onHoverOut={blurSettingsPanel}');
  });

  it('슬라이더 조작 중에는 운영 패널 접힘 타이머를 실행하지 않는다', () => {
    expect(lobbySource).toContain('settingsInteractionActive');
    expect(lobbySource).toContain('if (settingsInteractionActive.current)');
    expect(lobbySource).toContain(
      'onInteractionStart={startSettingsInteraction}',
    );
    expect(clockSpeedSettingSource).toContain('onInteractionStart?.()');
    expect(clockSpeedSettingSource).toContain('onInteractionEnd?.()');
  });
});
