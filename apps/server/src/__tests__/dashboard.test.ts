import { describe, expect, it } from 'vitest';
import { getDashboardHtml } from '../dashboard.js';

describe('dashboard html', () => {
  it('플레이어에게 게임 앱 QR과 서버 접속 QR만 안내한다', () => {
    const html = getDashboardHtml(
      'http://192.168.0.17:3000',
      'http://192.168.0.17:8081',
      'http://192.168.0.17:8082',
      'exp://192.168.0.17:8081',
    );

    expect(html).toContain('시계탑 진행 대시보드');
    expect(html).not.toContain('Expo Go iOS 설치 QR');
    expect(html).not.toContain('Expo Go Android 설치 QR');
    expect(html).not.toContain(
      'https://apps.apple.com/app/expo-go/id982107779',
    );
    expect(html).not.toContain(
      'https://play.google.com/store/apps/details?id=host.exp.exponent',
    );
    expect(html).not.toContain('플레이어 웹 QR');
    expect(html).not.toContain('플레이어 웹 열기');
    expect(html).not.toContain('이야기꾼 Expo Go QR');
    expect(html).toContain('exp://192.168.0.17:8081');
    expect(html).not.toContain('exp://192.168.0.17:8082');
    expect(html).toContain('http://192.168.0.17:8082');
    expect(html).toContain('http://192.168.0.17:3000');
    expect(html).toContain('qr-card');
    expect(html).toContain('is-dim');
    expect(html).toContain('카드를 클릭하면 QR을 어둡게 숨깁니다');
    expect(html).toContain('Expo Go는 앱스토어 또는 플레이스토어에서 설치');
    expect(html).toContain('게임 앱 QR을 스캔해 앱을 연 뒤');
    expect(html).toContain('서버 접속 QR');
    expect(html).toContain('이야기꾼 웹 열기');
    expect(html).toContain('서버 상태 열기');
    expect(html).toContain('© DevGon');
  });
});
