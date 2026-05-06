import { describe, expect, it } from 'vitest';
import { getDashboardHtml } from '../dashboard.js';

describe('dashboard html', () => {
  it('Expo Go 설치 QR과 앱 실행 QR을 함께 안내한다', () => {
    const html = getDashboardHtml(
      'http://192.168.0.17:3000',
      'http://192.168.0.17:8081',
      'http://192.168.0.17:8082',
      'exp://192.168.0.17:8081',
      'exp://192.168.0.17:8082',
    );

    expect(html).toContain('시계탑 진행 대시보드');
    expect(html).toContain('Expo Go iOS 설치 QR');
    expect(html).toContain('Expo Go Android 설치 QR');
    expect(html).toContain('https://apps.apple.com/app/expo-go/id982107779');
    expect(html).toContain(
      'https://play.google.com/store/apps/details?id=host.exp.exponent',
    );
    expect(html).toContain('exp://192.168.0.17:8081');
    expect(html).toContain('exp://192.168.0.17:8082');
    expect(html).toContain('http://192.168.0.17:8081');
    expect(html).toContain('http://192.168.0.17:8082');
    expect(html).toContain('http://192.168.0.17:3000');
    expect(html).toContain('qr-card');
    expect(html).toContain('is-dim');
    expect(html).toContain('카드를 클릭하면 QR을 어둡게 숨깁니다');
    expect(html).toContain('플레이어 웹 열기');
    expect(html).toContain('이야기꾼 웹 열기');
    expect(html).toContain('서버 상태 열기');
    expect(html).toContain('© DevGon');
  });
});
