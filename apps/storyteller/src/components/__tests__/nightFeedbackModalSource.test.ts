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
const nightPanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/NightPanel.tsx'),
  'utf8',
);

describe('night feedback modal shell', () => {
  it('renders a Korean-only angular modal with a collapsible, scrollable shell', () => {
    expect(panelSource).toContain('import { Modal');
    expect(panelSource).toContain('animationType="fade"');
    expect(panelSource).toContain('accessibilityLabel="피드백 접기"');
    expect(panelSource).toContain('현재 추천 피드백');
    expect(panelSource).toContain('전달할 피드백을 직접 선택하세요.');
    expect(panelSource).not.toContain('Night feedback');
    expect(panelSource).not.toContain('AnimatedBorderCard');
    expect(panelSource).toContain('<ScrollView');

    expect(styleSource).toContain('maxWidth: 720');
    expect(styleSource).toContain("maxHeight: '90%'");
    expect(styleSource.match(/borderRadius: 3/g)).toHaveLength(3);
  });

  it('keeps target progress mounted while only modal visibility changes', () => {
    expect(panelSource).toContain('visible: boolean;');
    expect(panelSource).toContain('onCollapse: () => void;');
    expect(panelSource).not.toContain('[activeRoleId, visible]');
    expect(nightPanelSource).toContain('visible={!feedbackCollapsed}');
    expect(nightPanelSource).toContain(
      'onCollapse={() => setFeedbackCollapsed(true)}',
    );
    expect(nightPanelSource).toContain('key={activeNightRoleId}');
    expect(nightPanelSource).toContain(
      '{hasNightFeedback && !isFeedbackSent && (',
    );
  });
});
